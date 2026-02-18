#!/usr/bin/env python3
"""
Instaloader Client for Claude Code Skill

Usage:
    python instaloader-client.py <command> [args...]

Commands:
    # Authentication
    login                                    - Login with credentials
    test-auth                                - Verify session is valid

    # UGC Downloads
    download-tagged --output-dir DIR [--limit N] [--fast-update]
    download-hashtag <hashtag> --output-dir DIR [--limit N]
    download-post <shortcode> --output-dir DIR
    download-profile <username> --output-dir DIR [--limit N]

    # User Research
    get-profile <username>                   - Get user profile info
    get-followers [--limit N]                - Get our followers
    get-following [--limit N]                - Get accounts we follow
    get-post-info <shortcode>                - Get post metadata
    get-comments <shortcode> [--limit N]     - Get comments on post

    # Stories & Highlights
    download-stories <username> --output-dir DIR
    download-highlights <username> --output-dir DIR
"""

import argparse
import json
import os
import sys
from datetime import datetime
from itertools import islice
from pathlib import Path

try:
    import instaloader
    from instaloader import Instaloader, Profile, Post, StoryItem
except ImportError:
    print(json.dumps({
        "success": False,
        "error": "instaloader not installed. Run: pip install instaloader"
    }))
    sys.exit(1)

# Load environment variables from .env file
def load_env():
    """Load environment variables from .env file"""
    env_path = Path(__file__).parent.parent.parent.parent.parent / ".env"
    if env_path.exists():
        with open(env_path) as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith("#") and "=" in line:
                    key, value = line.split("=", 1)
                    os.environ.setdefault(key.strip(), value.strip())

load_env()

# Configuration
INSTAGRAM_USERNAME = os.environ.get("INSTAGRAM_USERNAME", "")
INSTAGRAM_PASSWORD = os.environ.get("INSTAGRAM_PASSWORD", "")
TARGET_PROFILE = "yourbrand"  # The main business account


def get_instaloader(login_required=True) -> Instaloader:
    """Create and configure Instaloader instance"""
    L = Instaloader(
        download_pictures=True,
        download_videos=True,
        download_video_thumbnails=False,
        download_geotags=False,
        download_comments=False,
        save_metadata=True,
        compress_json=False,
        post_metadata_txt_pattern="",
        request_timeout=10.0,
    )

    if login_required:
        # Try to load existing session
        try:
            L.load_session_from_file(INSTAGRAM_USERNAME)
        except FileNotFoundError:
            # No session file, need to login
            if not INSTAGRAM_USERNAME or not INSTAGRAM_PASSWORD:
                raise ValueError(
                    "Missing INSTAGRAM_USERNAME or INSTAGRAM_PASSWORD in .env file. "
                    "Run 'python instaloader-client.py login' first."
                )
            L.login(INSTAGRAM_USERNAME, INSTAGRAM_PASSWORD)
            L.save_session_to_file()

    return L


def json_output(data):
    """Print JSON output"""
    print(json.dumps(data, indent=2, default=str))


# ==================== Authentication ====================

def cmd_login(args):
    """Login and save session"""
    if not INSTAGRAM_USERNAME or not INSTAGRAM_PASSWORD:
        return {"success": False, "error": "Missing INSTAGRAM_USERNAME or INSTAGRAM_PASSWORD in .env file"}

    try:
        L = Instaloader()
        L.login(INSTAGRAM_USERNAME, INSTAGRAM_PASSWORD)
        L.save_session_to_file()
        return {
            "success": True,
            "message": f"Login successful. Session saved for {INSTAGRAM_USERNAME}.",
            "session_file": f"~/.config/instaloader/session-{INSTAGRAM_USERNAME}"
        }
    except instaloader.exceptions.TwoFactorAuthRequiredException:
        return {
            "success": False,
            "error": "Two-factor authentication required. Please use instaloader CLI directly: instaloader --login USERNAME",
            "username": INSTAGRAM_USERNAME
        }
    except instaloader.exceptions.BadCredentialsException:
        return {
            "success": False,
            "error": "Bad credentials. Check INSTAGRAM_USERNAME and INSTAGRAM_PASSWORD in .env file.",
            "username": INSTAGRAM_USERNAME
        }
    except instaloader.exceptions.ConnectionException as e:
        return {
            "success": False,
            "error": f"Connection error: {str(e)}. Instagram may have blocked this login attempt.",
            "username": INSTAGRAM_USERNAME,
            "hint": "Try logging in via the instaloader CLI: instaloader --login USERNAME"
        }
    except Exception as e:
        return {
            "success": False,
            "error": f"Login error: {str(e)}",
            "username": INSTAGRAM_USERNAME,
            "hint": "If 2FA is enabled, use: instaloader --login USERNAME"
        }


def cmd_test_auth(args):
    """Test authentication"""
    try:
        L = get_instaloader(login_required=True)
        # Try to get own profile as a test
        profile = Profile.from_username(L.context, INSTAGRAM_USERNAME)
        return {
            "success": True,
            "message": "Authentication successful.",
            "username": profile.username,
            "followers": profile.followers,
        }
    except Exception as e:
        return {"success": False, "error": str(e)}


# ==================== UGC Downloads ====================

def cmd_download_tagged(args):
    """Download posts where we're tagged using instaloader CLI with latest-stamps"""
    import subprocess

    # Default output directory
    output_dir = Path(args.output_dir) if args.output_dir else Path.home() / "Air" / "YourBrand" / "Instagram"
    output_dir.mkdir(parents=True, exist_ok=True)

    # Build instaloader CLI command matching user's preferred settings
    cmd = [
        "instaloader",
        f"--login={INSTAGRAM_USERNAME}",
        "--dirname-pattern={profile}",
        "--filename-pattern={shortcode}",
        "--no-captions",
        "--no-video-thumbnails",
        "--no-compress-json",
        "--tagged",
        TARGET_PROFILE,
    ]

    # Add latest-stamps for incremental downloads
    if args.fast_update:
        cmd.append("--latest-stamps")

    try:
        # Run from the output directory
        result = subprocess.run(
            cmd,
            cwd=str(output_dir),
            capture_output=True,
            text=True,
            timeout=600  # 10 minute timeout
        )

        return {
            "success": result.returncode == 0,
            "output_dir": str(output_dir),
            "command": " ".join(cmd),
            "stdout": result.stdout,
            "stderr": result.stderr if result.returncode != 0 else None,
            "fast_update": args.fast_update,
        }
    except subprocess.TimeoutExpired:
        return {"success": False, "error": "Command timed out after 10 minutes"}
    except Exception as e:
        return {"success": False, "error": str(e)}


def cmd_download_hashtag(args):
    """Download posts from a hashtag"""
    try:
        L = get_instaloader()
        hashtag = instaloader.Hashtag.from_name(L.context, args.hashtag)

        output_dir = Path(args.output_dir)
        output_dir.mkdir(parents=True, exist_ok=True)

        downloaded = []
        limit = args.limit or 20

        for post in islice(hashtag.get_posts(), limit):
            try:
                L.download_post(post, target=str(output_dir / post.shortcode))
                downloaded.append({
                    "shortcode": post.shortcode,
                    "url": f"https://instagram.com/p/{post.shortcode}/",
                    "owner": post.owner_username,
                    "likes": post.likes,
                    "date": post.date_utc.isoformat(),
                })
            except Exception as e:
                downloaded.append({
                    "shortcode": post.shortcode,
                    "error": str(e)
                })

        return {
            "success": True,
            "hashtag": args.hashtag,
            "downloaded": len([d for d in downloaded if "error" not in d]),
            "posts": downloaded,
            "output_dir": str(output_dir),
        }
    except Exception as e:
        return {"success": False, "error": str(e)}


def cmd_download_post(args):
    """Download a specific post by shortcode"""
    try:
        L = get_instaloader()
        post = Post.from_shortcode(L.context, args.shortcode)

        output_dir = Path(args.output_dir)
        output_dir.mkdir(parents=True, exist_ok=True)

        L.download_post(post, target=str(output_dir / post.shortcode))

        return {
            "success": True,
            "shortcode": post.shortcode,
            "url": f"https://instagram.com/p/{post.shortcode}/",
            "owner": post.owner_username,
            "caption": post.caption[:500] if post.caption else None,
            "likes": post.likes,
            "comments": post.comments,
            "date": post.date_utc.isoformat(),
            "output_dir": str(output_dir / post.shortcode),
        }
    except Exception as e:
        return {"success": False, "error": str(e)}


def cmd_download_profile(args):
    """Download posts from a user's profile"""
    try:
        L = get_instaloader()
        profile = Profile.from_username(L.context, args.username)

        output_dir = Path(args.output_dir)
        output_dir.mkdir(parents=True, exist_ok=True)

        downloaded = []
        limit = args.limit or 10

        for post in islice(profile.get_posts(), limit):
            try:
                L.download_post(post, target=str(output_dir / post.shortcode))
                downloaded.append({
                    "shortcode": post.shortcode,
                    "url": f"https://instagram.com/p/{post.shortcode}/",
                    "likes": post.likes,
                    "date": post.date_utc.isoformat(),
                })
            except Exception as e:
                downloaded.append({
                    "shortcode": post.shortcode,
                    "error": str(e)
                })

        return {
            "success": True,
            "username": args.username,
            "downloaded": len([d for d in downloaded if "error" not in d]),
            "posts": downloaded,
            "output_dir": str(output_dir),
        }
    except Exception as e:
        return {"success": False, "error": str(e)}


# ==================== User Research ====================

def cmd_get_profile(args):
    """Get profile information for a user"""
    try:
        L = get_instaloader()
        profile = Profile.from_username(L.context, args.username)

        return {
            "success": True,
            "profile": {
                "username": profile.username,
                "full_name": profile.full_name,
                "biography": profile.biography,
                "followers": profile.followers,
                "followees": profile.followees,
                "mediacount": profile.mediacount,
                "is_verified": profile.is_verified,
                "is_private": profile.is_private,
                "is_business_account": profile.is_business_account,
                "business_category_name": profile.business_category_name,
                "external_url": profile.external_url,
                "profile_pic_url": profile.profile_pic_url,
            }
        }
    except Exception as e:
        return {"success": False, "error": str(e)}


def cmd_get_followers(args):
    """Get list of followers"""
    try:
        L = get_instaloader()
        profile = Profile.from_username(L.context, TARGET_PROFILE)

        followers = []
        limit = args.limit or 100

        for follower in islice(profile.get_followers(), limit):
            followers.append({
                "username": follower.username,
                "full_name": follower.full_name,
                "followers": follower.followers,
                "is_verified": follower.is_verified,
                "is_private": follower.is_private,
            })

        return {
            "success": True,
            "count": len(followers),
            "followers": followers,
        }
    except Exception as e:
        return {"success": False, "error": str(e)}


def cmd_get_following(args):
    """Get list of accounts we follow"""
    try:
        L = get_instaloader()
        profile = Profile.from_username(L.context, TARGET_PROFILE)

        following = []
        limit = args.limit or 100

        for followee in islice(profile.get_followees(), limit):
            following.append({
                "username": followee.username,
                "full_name": followee.full_name,
                "followers": followee.followers,
                "is_verified": followee.is_verified,
            })

        return {
            "success": True,
            "count": len(following),
            "following": following,
        }
    except Exception as e:
        return {"success": False, "error": str(e)}


def cmd_get_post_info(args):
    """Get metadata for a specific post"""
    try:
        L = get_instaloader()
        post = Post.from_shortcode(L.context, args.shortcode)

        # Get tagged users
        tagged_users = []
        try:
            tagged_users = list(post.tagged_users)
        except Exception:
            pass

        return {
            "success": True,
            "post": {
                "shortcode": post.shortcode,
                "url": f"https://instagram.com/p/{post.shortcode}/",
                "caption": post.caption,
                "likes": post.likes,
                "comments": post.comments,
                "date": post.date_utc.isoformat(),
                "owner": {
                    "username": post.owner_username,
                    "id": post.owner_id,
                },
                "tagged_users": tagged_users,
                "location": {
                    "name": post.location.name if post.location else None,
                    "lat": post.location.lat if post.location else None,
                    "lng": post.location.lng if post.location else None,
                } if post.location else None,
                "hashtags": list(post.caption_hashtags) if post.caption_hashtags else [],
                "mentions": list(post.caption_mentions) if post.caption_mentions else [],
                "media_type": post.typename,
                "is_video": post.is_video,
                "video_view_count": post.video_view_count if post.is_video else None,
            }
        }
    except Exception as e:
        return {"success": False, "error": str(e)}


def cmd_get_comments(args):
    """Get comments on a post"""
    try:
        L = get_instaloader()
        post = Post.from_shortcode(L.context, args.shortcode)

        comments = []
        limit = args.limit or 50

        for comment in islice(post.get_comments(), limit):
            comments.append({
                "id": comment.id,
                "text": comment.text,
                "owner": comment.owner.username,
                "created_at": comment.created_at_utc.isoformat(),
                "likes": comment.likes_count,
                "answers_count": comment.answers_count,
            })

        return {
            "success": True,
            "shortcode": args.shortcode,
            "count": len(comments),
            "comments": comments,
        }
    except Exception as e:
        return {"success": False, "error": str(e)}


# ==================== Stories & Highlights ====================

def cmd_download_stories(args):
    """Download active stories from a user"""
    try:
        L = get_instaloader()
        profile = Profile.from_username(L.context, args.username)

        output_dir = Path(args.output_dir)
        output_dir.mkdir(parents=True, exist_ok=True)

        downloaded = []

        # Download stories
        L.download_stories(userids=[profile.userid], filename_target=str(output_dir))

        return {
            "success": True,
            "username": args.username,
            "output_dir": str(output_dir),
            "message": f"Stories downloaded to {output_dir}",
        }
    except Exception as e:
        return {"success": False, "error": str(e)}


def cmd_download_highlights(args):
    """Download highlights from a user"""
    try:
        L = get_instaloader()
        profile = Profile.from_username(L.context, args.username)

        output_dir = Path(args.output_dir)
        output_dir.mkdir(parents=True, exist_ok=True)

        highlights_count = 0

        for highlight in profile.get_highlights():
            L.download_highlight(highlight, target=str(output_dir / highlight.title))
            highlights_count += 1

        return {
            "success": True,
            "username": args.username,
            "highlights_downloaded": highlights_count,
            "output_dir": str(output_dir),
        }
    except Exception as e:
        return {"success": False, "error": str(e)}


# ==================== Main ====================

def main():
    parser = argparse.ArgumentParser(description="Instaloader Client for Claude Code")
    subparsers = parser.add_subparsers(dest="command", help="Command to run")

    # Authentication
    subparsers.add_parser("login", help="Login and save session")
    subparsers.add_parser("test-auth", help="Test authentication")

    # UGC Downloads
    p = subparsers.add_parser("download-tagged", help="Download tagged posts")
    p.add_argument("--output-dir", help="Output directory (default: ~/Air/YourBrand/Instagram)")
    p.add_argument("--limit", type=int, help="Max posts to download")
    p.add_argument("--fast-update", action="store_true", help="Only download new posts (use --latest-stamps)")

    p = subparsers.add_parser("download-hashtag", help="Download hashtag posts")
    p.add_argument("hashtag", help="Hashtag to download")
    p.add_argument("--output-dir", required=True, help="Output directory")
    p.add_argument("--limit", type=int, help="Max posts to download")

    p = subparsers.add_parser("download-post", help="Download specific post")
    p.add_argument("shortcode", help="Post shortcode")
    p.add_argument("--output-dir", required=True, help="Output directory")

    p = subparsers.add_parser("download-profile", help="Download profile posts")
    p.add_argument("username", help="Username to download")
    p.add_argument("--output-dir", required=True, help="Output directory")
    p.add_argument("--limit", type=int, help="Max posts to download")

    # User Research
    p = subparsers.add_parser("get-profile", help="Get profile info")
    p.add_argument("username", help="Username to lookup")

    p = subparsers.add_parser("get-followers", help="Get followers list")
    p.add_argument("--limit", type=int, help="Max followers to return")

    p = subparsers.add_parser("get-following", help="Get following list")
    p.add_argument("--limit", type=int, help="Max accounts to return")

    p = subparsers.add_parser("get-post-info", help="Get post metadata")
    p.add_argument("shortcode", help="Post shortcode")

    p = subparsers.add_parser("get-comments", help="Get post comments")
    p.add_argument("shortcode", help="Post shortcode")
    p.add_argument("--limit", type=int, help="Max comments to return")

    # Stories & Highlights
    p = subparsers.add_parser("download-stories", help="Download user stories")
    p.add_argument("username", help="Username")
    p.add_argument("--output-dir", required=True, help="Output directory")

    p = subparsers.add_parser("download-highlights", help="Download user highlights")
    p.add_argument("username", help="Username")
    p.add_argument("--output-dir", required=True, help="Output directory")

    args = parser.parse_args()

    if not args.command:
        parser.print_help()
        sys.exit(1)

    # Map commands to functions
    commands = {
        "login": cmd_login,
        "test-auth": cmd_test_auth,
        "download-tagged": cmd_download_tagged,
        "download-hashtag": cmd_download_hashtag,
        "download-post": cmd_download_post,
        "download-profile": cmd_download_profile,
        "get-profile": cmd_get_profile,
        "get-followers": cmd_get_followers,
        "get-following": cmd_get_following,
        "get-post-info": cmd_get_post_info,
        "get-comments": cmd_get_comments,
        "download-stories": cmd_download_stories,
        "download-highlights": cmd_download_highlights,
    }

    cmd_func = commands.get(args.command)
    if cmd_func:
        result = cmd_func(args)
        json_output(result)
    else:
        print(json.dumps({"success": False, "error": f"Unknown command: {args.command}"}))
        sys.exit(1)


if __name__ == "__main__":
    main()
