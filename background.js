/*
This script is the backbone of the extention: 
Keep the url of your opened bookmarks updated when you advance in your reading
using addListener on chrome.tabs.onUpdated 
*/


//The list of all your bookmarks
var upToDateBookmarks = new Array();


//The map of tab if with the coresponding bookmark oppen inside it.
const activeBookmarksbyId = new Map();




//Loads bookmarks from the specific folder TheScans
chrome.bookmarks.getTree(function (bookmarkTreeNodes) {
  var folder = findFolder(bookmarkTreeNodes[0], "UpToDate");
  if (folder) {
    addAllFolder(folder);
  }
});


//Recursive methode to find a folder by name
function findFolder(node, folderName) {
  if (node.title === folderName && node.children) {
    return node;
  }
  if (node.children) {
    for (var i = 0; i < node.children.length; i++) {
      var foundFolder = findFolder(node.children[i], folderName);
      if (foundFolder) {
        return foundFolder;
      }
    }
  }
  return null;//Should be the creation of the said folder...
}


//Adds all the bookmarks even if you have multiple subfolders
function addAllFolder(node) {
  if (node.children) {
    for (var i = 0; i < node.children.length; i++) {
      //Start recursive search
      addAllFolder(node.children[i]);
    }
  } else {
    upToDateBookmarks.push(node);
  }
}


//If tab is created with url from out folder then : we keep track of it and it's url changes.
chrome.tabs.onCreated.addListener(function (tab) {
  // This function will be called when a new tab is created.
  // Pending url will be the one to open the tab
  upToDateBookmarks.forEach(element => {
    if (tab.pendingUrl === element.url) {
      activeBookmarksbyId.set(tab.id, element);
      console.log("onCreated.addListener " + tab.pendingUrl);
    }
  });
});


//We remove it's ID (incase reuse ?)
chrome.tabs.onRemoved.addListener(function (tab) {
  // This function will be called when a new tab is created.
  // Pending url will be the one to open the tab
  if (activeBookmarksbyId.has(tab.id)) {
    activeBookmarksbyId.delete(tab.id);
  }
});


//Hapens chen a tab has a change in URL:
// It is here that we want to update the favorite if it is an active tab (avoid looking at every tabs and every url redirect)
chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
  if (activeBookmarksbyId.has(tabId)) {
    if (changeInfo.url !== "") {
      let updatedBookmark = activeBookmarksbyId.get(tabId);
      updatedBookmark.url = changeInfo.url

      const twoPropBookmark = {
        title: updatedBookmark.title,
        url: updatedBookmark.url
      };

      // Update the bookmark using the chrome.bookmarks.update method
      chrome.bookmarks.update(updatedBookmark.id, twoPropBookmark, () => {
        // Bookmark updated successfully
        console.log("Bookmark updated successfully");
      });
    }
  }
}
);