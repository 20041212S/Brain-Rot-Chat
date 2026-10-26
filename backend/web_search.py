import html
import logging
import re
import urllib.parse
import httpx

logger = logging.getLogger("brainrot.web_search")

async def search_urban_dictionary(term: str, client: httpx.AsyncClient) -> str | None:
    """Queries Urban Dictionary public API for current slang definitions."""
    try:
        url = f"https://api.urbandictionary.com/v0/define?term={urllib.parse.quote(term)}"
        res = await client.get(url, timeout=3.0)
        if res.status_code == 200:
            data = res.json()
            items = data.get("list", [])
            if items:
                # Top definition with highest thumbs up
                top = max(items[:3], key=lambda x: x.get("thumbs_up", 0))
                definition = re.sub(r"[\[\]]", "", top.get("definition", "")).strip()
                example = re.sub(r"[\[\]]", "", top.get("example", "")).strip()
                result = f"Urban Dictionary on '{term}': {definition[:300]}"
                if example:
                    result += f" (Example: {example[:180]})"
                return result
    except Exception as e:
        logger.debug(f"Urban dictionary lookup failed for '{term}': {e}")
    return None

async def search_duckduckgo(query: str, client: httpx.AsyncClient) -> str | None:
    """Searches DuckDuckGo HTML for live internet slang, memes, and current lore."""
    try:
        url = "https://html.duckduckgo.com/html/"
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        }
        res = await client.post(
            url,
            data={"q": f"{query} slang meaning meme"},
            headers=headers,
            timeout=3.5
        )
        if res.status_code == 200:
            # Extract search snippets
            raw_snippets = re.findall(r'class="result__snippet"[^>]*>(.*?)</a>', res.text)
            clean_snippets = []
            for s in raw_snippets[:3]:
                # Remove html tags and unescape
                clean = html.unescape(re.sub(r"<[^>]+>", "", s)).strip()
                if clean and len(clean) > 20:
                    clean_snippets.append(clean)
            if clean_snippets:
                return "Web Search Intel: " + " | ".join(clean_snippets[:2])
    except Exception as e:
        logger.debug(f"DuckDuckGo search failed for '{query}': {e}")
    return None

async def get_live_internet_intel(query: str) -> str:
    """Extracts live internet slang/meme intel for a user prompt if relevant."""
    q = query.strip()
    if not q or len(q) < 3:
        return ""

    # Detect if user is asking about slang, a meme, a trend, or an unfamiliar term
    indicators = [
        "what is", "what does", "who is", "meaning", "slang", "trend", "meme",
        "lore", "explain", "why do", "define", "skibidi", "rizz", "fanum", "sigma",
        "gyatt", "mewing", "mog", "bop", "crashout", "demure", "cooked", "aura"
    ]
    q_lower = q.lower()
    is_lookup = any(ind in q_lower for ind in indicators) or len(q.split()) <= 4

    # Extract target keyword/phrase
    clean_target = re.sub(r"^(what('s| is| does)?|who('s| is)?|explain|define|tell me about|meaning of)\s+", "", q_lower, flags=re.I)
    clean_target = re.sub(r"\s+(mean|mean in slang|slang|meme)\??$", "", clean_target).strip("? .!\"'")

    if not clean_target:
        clean_target = q

    async with httpx.AsyncClient(timeout=4.0) as client:
        # Try Urban Dictionary first for concise definitions
        if len(clean_target.split()) <= 3:
            ud_intel = await search_urban_dictionary(clean_target, client)
            if ud_intel:
                return ud_intel

        # Fallback to DuckDuckGo if user asked a broader question or UD had no result
        if is_lookup:
            ddg_intel = await search_duckduckgo(clean_target, client)
            if ddg_intel:
                return ddg_intel

    return ""
