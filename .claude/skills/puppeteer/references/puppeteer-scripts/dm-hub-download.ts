#!/usr/bin/env -S deno run --allow-all

/**
 * DM Hub Daily Sales Report Download
 *
 * This script automates:
 * 1. Login to DM Hub
 * 2. Navigate to reports section
 * 3. Download daily sales report
 *
 * Environment variables required:
 * - DM_USERNAME
 * - DM_PASSWORD
 * - HEADLESS (optional, defaults to false)
 */

import { queryDatabase } from 'lib/database.ts';
import { runInBrowser } from 'lib/puppeteer.ts';
import * as XLSX from 'sheetjs';
import skuMap from 'assets/sku_map.json' with { type: 'json' };
import { QueryObjectResult } from 'postgres/query';
import '@std/dotenv/load';

const normalizeOrders = (data: any[]): any[] => {
  const map = data.reduce((result, item) => {
    const id = item['Order Number'];
    const sku = (skuMap as { [key: string]: string })[item['OEM Number']];
    return {
      ...result,
      [id]: {
        id,
        name: item['Dealer PO'] || item['Enduser PO Number'],
        status: item['Order Status'],
        created_at: new Date(item['Order Date']),
        customer: item['Ship To Name'],
        address1: item['Ship To Address 1'],
        address2: item['Ship To Address 2'],
        city: item['Ship To City'],
        province: item['Ship To State'],
        zip: item['Ship To ZIP'],
        country: item['Ship To Country'],
        phone:
          item['Ship To Phone Number'] === '() -'
            ? null
            : item['Ship To Phone Number'],
        email: item['Ship To Email Address'],
        shipped_date: item['Shipped Date']
          ? new Date(item['Shipped Date'])
          : null,
        shipping_cost: item['Order Freight'],
        weight: item['Product Weight'],
        ship_via: item['Ship Via'],
        line_items: [
          ...(result[id] ? result[id].line_items : []),
          {
            sku: sku || item['OEM Number'],
            quantity: item['Qty'],
            tracking_number: item['Tracking Number'],
          },
        ],
      },
    };
  }, {});
  return Object.values(map);
};

const updateTable = (
  data: any[],
  table: string,
  pkey: string
): Promise<QueryObjectResult['rows']> => {
  const { _count, values, parameters } = data.reduce(
    (result, item) => ({
      count: result.count + 2,
      values: [
        ...result.values,
        `($${result.count + 1}, $${result.count + 2})`,
      ],
      parameters: [...result.parameters, item[pkey], item],
    }),
    { count: 0, values: [], parameters: [] }
  );
  return queryDatabase(
    `INSERT INTO ${table} (id, data)
VALUES
${values.join(',\n\t')}
ON CONFLICT (id) DO
UPDATE SET data = excluded.data;`,
    parameters
  );
};

export const workflow = (
	report: string,
	filename: string
): Promise<Uint8Array> => {
	return runInBrowser(async (page) => {
		console.log('Navigating to DM Hub...');
		await page.goto('https://www.dm-hub.net/');

		console.log('Finding email input field...');
		const emailInput = await page.waitForSelector('#email', { visible: true });
		console.log('Typing email...');
		await emailInput?.type(Deno.env.get('DM_USERNAME') as string, {
			delay: 10,
		});

		console.log('Finding password input field...');
		const passwordInput = await page.waitForSelector('#password', {
			visible: true,
		});
		console.log('Typing password...');
		await passwordInput?.type(Deno.env.get('DM_PASSWORD') as string, {
			delay: 10,
		});

		console.log('Clicking sign in button...');
		const signInButton = await page.waitForSelector('#next', {
			visible: true,
		});
		await signInButton?.click();

		console.log('Waiting for navigation after login...');
		await page.waitForNavigation();

		console.log('Navigating to reports page...');
		await page.goto('https://www.dm-hub.net/reports');

		console.log('Finding filter field...');
		const filterField = await page.waitForSelector(
			'input[placeholder="Filter reports..."]',
			{ visible: true }
		);
		await page.waitForTimeout(500);

		console.log(`Filtering for report ${report}...`);
		await filterField?.type(report, { delay: 10 });
		await page.keyboard.down('Enter');

		console.log(`Waiting for report container ${report}...`);
		const reportContainer = await page.waitForXPath(
			`//div[contains(text(), '${report}')]`,
			{
				visible: true,
			}
		);

		console.log('Clicking period selector...');
		const periodSelector = await page.waitForSelector(
			'.report-parameters div:nth-child(1) .rz-dropdown',
			{
				visible: true,
			}
		);
		await periodSelector?.click();

		console.log('Selecting Custom period option...');
		const customOption = await page.waitForSelector('li[aria-label="Custom"]', {
			visible: true,
		});
		await customOption?.click();

		console.log('Finding date picker fields...');
		const periodFrom = await page.waitForSelector(
			'.report-parameters div:nth-child(2) .rz-datepicker input',
			{
				visible: true,
			}
		);
		const periodTo = await page.waitForSelector(
			'.report-parameters div:nth-child(3) .rz-datepicker input',
			{
				visible: true,
			}
		);

		const date = new Date();
		console.log(`Setting end date to ${date.toLocaleDateString()}...`);
		await page.waitForTimeout(500);
		await periodTo?.type(date.toLocaleDateString(), { delay: 10 });

		date.setDate(date.getDate() - 90);
		console.log(`Setting start date to ${date.toLocaleDateString()}...`);
		await page.waitForTimeout(500);
		await periodFrom?.type(date.toLocaleDateString(), { delay: 10 });

		console.log('Clicking download button...');
		const downloadButton = await page.waitForSelector('.download-button', {
			visible: true,
		});
		await downloadButton?.click();

		console.log(`Waiting for file ${filename} to download...`);
		await new Promise<void>((resolve) => {
			const interval = setInterval(async () => {
				if (await exists(`./assets/${filename}`)) {
					console.log(`File ${filename} downloaded successfully`);
					clearInterval(interval);
					resolve();
				}
			}, 1000);
		});

		console.log('Reading downloaded file...');
		const result = await Deno.readFile(`./assets/${filename}`);

		console.log('Closing page...');
		await page.close();

		console.log('Download complete');
		return result;
	});
};

export const runWorkflow = async () => {
	// Run workflow
  const data = await workflow('7895', '7895_AllOrders.xlsx');
	// Parse data
  const spreadsheet = XLSX.read(data);
  const orders = XLSX.utils.sheet_to_json(
    spreadsheet.Sheets[spreadsheet.SheetNames[0]],
    { range: 5, raw: false }
  );
	// Normalize data to dm_orders table schema
  const normalizedOrders = normalizeOrders(orders.slice(0, orders.length - 3));
  console.log(normalizedOrders);
	// Upsert data into dm_orders table
  await updateTable(normalizedOrders, 'dm_orders', 'id');
  return queryDatabase(`SELECT COUNT(*) FROM dm_orders;`);
};