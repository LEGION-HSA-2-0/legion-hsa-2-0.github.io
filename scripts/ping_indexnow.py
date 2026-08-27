#!/usr/bin/env python3
"""
Ping IndexNow and Search Engines for LEGION HSA 2.0 Website.
Sends instant indexing requests to IndexNow (Bing, Yandex, Seznam, Naver) and Google Sitemap endpoints.
"""

import json
import urllib.request
import urllib.error
import sys

HOST = "legion-hsa-2-0.github.io"
KEY = "a3f81e97d4b641c888e23f05b1c9029a"
KEY_LOCATION = f"https://{HOST}/{KEY}.txt"
URL_LIST = [
    f"https://{HOST}/",
    f"https://{HOST}/legal.html"
]

def ping_indexnow():
    endpoint = "https://api.indexnow.org/indexnow"
    payload = {
        "host": HOST,
        "key": KEY,
        "keyLocation": KEY_LOCATION,
        "urlList": URL_LIST
    }
    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(
        endpoint,
        data=data,
        headers={"Content-Type": "application/json; charset=utf-8"},
        method="POST"
    )
    print(f"[*] Sending IndexNow ping to {endpoint}...")
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            print(f"[+] IndexNow Response: HTTP {resp.status} {resp.reason}")
    except urllib.error.HTTPError as e:
        print(f"[-] IndexNow HTTP error: {e.code} {e.reason}")
    except Exception as e:
        print(f"[-] IndexNow error: {e}")

def ping_google_sitemap():
    sitemap_url = f"https://{HOST}/sitemap.xml"
    google_ping_url = f"https://www.google.com/ping?sitemap={sitemap_url}"
    print(f"[*] Pinging Google sitemap endpoint...")
    try:
        req = urllib.request.Request(google_ping_url, headers={"User-Agent": "LEGION-SEO-Bot/1.0"})
        with urllib.request.urlopen(req, timeout=10) as resp:
            print(f"[+] Google Ping Response: HTTP {resp.status}")
    except Exception as e:
        print(f"[*] Google sitemap ping notice: {e}")

if __name__ == "__main__":
    print(f"=== Triggering Search Engine Indexing for {HOST} ===")
    ping_indexnow()
    ping_google_sitemap()
    print("=== Done ===")
