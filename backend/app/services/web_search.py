from duckduckgo_search import DDGS
import logging
from typing import List, Dict

logger = logging.getLogger(__name__)

try:
    from googlesearch import search as google_search
except ImportError:
    google_search = None

def perform_google_search(query: str, max_results: int = 3) -> List[Dict[str, str]]:
    """Fallback using googlesearch-python"""
    results = []
    if not google_search:
        logger.warning("googlesearch-python not installed, skipping fallback")
        return []
        
    try:
        # standard google search
        for j in google_search(query, num_results=max_results, advanced=True):
            results.append({
                "title": j.title,
                "href": j.url,
                "body": j.description
            })
    except Exception as e:
        logger.error(f"Google search fallback failed: {e}")
    return results

def perform_web_search(query: str, max_results: int = 3) -> List[Dict[str, str]]:
    """
    Perform a web search using DuckDuckGo, falling back to Google if needed.
    Returns a list of dictionaries with 'title', 'href', and 'body'.
    """
    results = []
    
    # 1. Try DuckDuckGo
    try:
        with DDGS() as ddgs:
            search_gen = ddgs.text(keywords=query, max_results=max_results)
            if search_gen:
                for r in search_gen:
                    results.append({
                        "title": r.get("title", ""),
                        "href": r.get("href", ""),
                        "body": r.get("body", "")
                    })
    except Exception as e:
        logger.error(f"DuckDuckGo search failed: {e}")
    
    # 2. Fallback to Google if DDG failed or returned no results
    if not results:
        logger.info("DuckDuckGo returned no results, trying Google fallback...")
        results = perform_google_search(query, max_results)
    
    return results

def format_search_results(results: List[Dict[str, str]]) -> str:
    """Format search results into a string context."""
    if not results:
        return "No search results found."
    
    formatted = "WEB SEARCH RESULTS:\n"
    for i, res in enumerate(results, 1):
        formatted += f"Source {i}: {res['title']}\n"
        formatted += f"URL: {res['href']}\n"
        formatted += f"Snippet: {res['body']}\n\n"
    
    return formatted
