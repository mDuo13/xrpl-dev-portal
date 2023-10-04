###############################################################################
## Update Links: tool to help change abc.html links to relative links to the md
## source file for the same file.
###############################################################################
import re
import os.path

LOCAL_HTML_LINK = re.compile("^[a-z_-]+\.html$")
REPLACE_IN_PLACE = False # False: only print changes, don't apply. True: open and rewrite files.

def find_page(html, pages):
    for page in pages:
        if page["html"] == html:
            return page
    return None

def filter_soup(soup, currentpage={}, config={}, pages=[], logger=None, **kwargs):
    if not currentpage.get("md", ""):
        logger.debug("Skipping non-md page "+currentpage["html"])
    links = soup.find_all("a", href=True)
    #if links:
    #    print("Source file:", currentpage["md"])

    find_replace_list = []
    for match in links:
        link = match["href"]
        if LOCAL_HTML_LINK.match(link):
            linked_page = find_page(link, pages)
            if not linked_page:
                logger.warning("Link to missing page "+link)
            elif not linked_page.get("md", ""):
                logger.info("Link to page with no md source "+link)
            else:
                pg_srcpath = os.path.dirname(currentpage["md"])
                rel_path = os.path.relpath(linked_page["md"], start=pg_srcpath)
                #TODO: do some actual substitution here if it seems promising
                print("Old link:", link)
                print("New link:", rel_path)
                find_replace_list.append( (link, rel_path) )

    if REPLACE_IN_PLACE and find_replace_list:
        print("%s: Replacing %d links"%(currentpage["md"], len(find_replace_list)))
        fpath = os.path.join(config["content_path"], currentpage["md"])
        with open(fpath, "r") as f:
            contents = f.read()
        for old, new in find_replace_list:
            contents = contents.replace(old, new)
        with open(fpath, "w") as f:
            f.write(contents)



