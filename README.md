# UpToDate
Chrome extension : Keeps the url of your bookmarks up to date.

You need to have create a folder named UpToDate. 
You add and manage the tree inside it as you want.
When you open a new tab from one of the bookmarks(main folder UpToDate) the extention will keep updating the url of that bookmark until you close it

I just find it perfect to folow differents scans/tutorials withouth having to manually edit the bookmark once i'm done reading.



uses :
chrome.tabs.onCreated.addListener(function (tab) to see if a new tab has a bookmark in it pendingUrl to keep track of it (and not ever tabs !)

chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) to change the url of the bookmarks
