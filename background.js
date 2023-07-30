/*
This script is the backbone of the extention: 
Keep the url of your opened bookmarks updated when you advance in your reading
using addListener on chrome.tabs.onUpdated 
*/


//The list of all your bookmarks
var upToDateBookmarks = new Map();


//The list of folders/subfolders that are inside UpToDate
var idsOfBookmarksInGoodFolder = new Array();


//The list of tabs that the plugin is activave on
var activeTabsId = new Set();
//The list of tabs that the plugin cannot activate on
var excludedTabs = new Map();



initializeAllFolderAndBookmarks();


//region Initialisation of the existing folders and bookmarks
//Loads bookmarks from the specific folder TheScans
function initializeAllFolderAndBookmarks() {
  upToDateBookmarks = new Map();
  idsOfBookmarksInGoodFolder = new Array();

  chrome.bookmarks.getTree(function (bookmarkTreeNodes) {
    var folder = findFolder(bookmarkTreeNodes[0], "UpdatedBookmarks");
    if (folder) {

      addAllFoldersAndBookmarks(folder);
    }
  });
}

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
  return null;
}


//Adds all the bookmarks even if you have multiple subfolders
function addAllFoldersAndBookmarks(node) {
  idsOfBookmarksInGoodFolder.push(node.id)
  console.log("idsOfBookmarksInGoodFolder " + node.id)

  if (!node.url) {
    for (var i = 0; i < node.children.length; i++) {
      //Start recursive search
      addAllFoldersAndBookmarks(node.children[i]);
    }
  } else {
    let startURL = node.title.split("|")[1];
    if (startURL !== undefined) { upToDateBookmarks.set(startURL, node); }
  }
}


//If tab is created with url from out folder then : we keep track of it and it's url changes.
chrome.tabs.onCreated.addListener(function (tab) {

});




function getMatchingUrlBookmark(urlToFind) {
  for (const element of upToDateBookmarks.keys()) {
    if (urlToFind.includes(element)) {
      return (upToDateBookmarks.get(element));
    }
  }

  return undefined;
}

//We remove it's ID (incase reuse ?)
chrome.tabs.onRemoved.addListener(function (tab) {
  // This function will be called when a new tab is created.
  // Pending url will be the one to open the tab

});



//Hapens chen a tab has a change in URL:
// It is here that we want to update the favorite if it is an active tab (avoid looking at every tabs and every url redirect)
chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
  if (changeInfo.url != undefined) {
    if (!excludedTabs.has(tabId)) {
      var bookmark = getMatchingUrlBookmark(changeInfo.url);
      if (bookmark != undefined) {
        // Update the bookmark using the chrome.bookmarks.update method
        var newURlPropBookmark = {
          url: changeInfo.url
        };
        chrome.bookmarks.update(bookmark.id, newURlPropBookmark, () => {
          activeTabsId.add(tabId);
        });
      } else {
        activeTabsId.delete(tabId);
      }
    }
  }

  if (activeTabsId.has(tabId)) {
    setExtensionIcon(tabId, true);
  } else {
    setExtensionIcon(tabId, false);
  }
});


async function setExtensionIcon(tabId, active) {
  if (active) {
    try {
      await chrome.browserAction.setBadgeText({
        tabId: tabId,
        text: "1",
      });
      await chrome.browserAction.setBadgeBackgroundColor({
        tabId: tabId,
        color: "#156924"
      });
    }
    catch (reason) {
      console.log(reason);
    }
  } else {
    try {
      await chrome.browserAction.setBadgeText({
        tabId: tabId,
        text: "0",
      });
      await chrome.browserAction.setBadgeBackgroundColor({
        tabId: tabId,
        color: "#363636"
      });
    }
    catch (reason) {
      console.log(reason);
    }
  }
}








//Section bookmarks events listener
chrome.bookmarks.onCreated.addListener(handleBookmarkCreated);
function handleBookmarkCreated(id, bookmarkInfo) {
  //Check if it is a bookmark of our elements
  if (idsOfBookmarksInGoodFolder.includes(bookmarkInfo.parentId)) {
    console.log("bookmark of interest created or moved " + bookmarkInfo);

    idsOfBookmarksInGoodFolder.push(id);

    let startURL = bookmarkInfo.title.split("|")[1];
    if (startURL !== undefined) {
      upToDateBookmarks.set(startURL, bookmarkInfo);
    }
  }
}


chrome.bookmarks.onRemoved.addListener(handleBookmarkRemoved);
// Function to handle bookmark removal
function handleBookmarkRemoved(id, removeInfo) {
  //Check if it is a bookmark of our elements
  if (idsOfBookmarksInGoodFolder.includes(id)) {
    var index = idsOfBookmarksInGoodFolder.indexOf(id);
    idsOfBookmarksInGoodFolder.splice(index, 1);

    if (removeInfo.node.url) {
      var startURL = removeInfo.node.title.split("|")[1];
      upToDateBookmarks.delete(startURL);
    }
  }
}


chrome.bookmarks.onChanged.addListener(handleBookmarkChanged);
function handleBookmarkChanged(id, changeInfo) {
  if (idsOfBookmarksInGoodFolder.includes(id)) {
    console.log("bookmark of interest modified " + id + " " + changeInfo.title + changeInfo.url);

    //if it is in the list : modify it
    let bookmarkInActiveList;
    upToDateBookmarks.forEach((value) => {
      if (value.id === id) {
        bookmarkInActiveList = value;
        console.log("bookmark found in active list ");
      }
    });

    if (bookmarkInActiveList !== undefined) {
      if (changeInfo.title.split("|")[1] !== undefined) {
        if (bookmarkInActiveList.url !== changeInfo.url || bookmarkInActiveList.title !== changeInfo.title) {
          bookmarkInActiveList.title = changeInfo.title.split("|")[1];
          bookmarkInActiveList.url = changeInfo.url;
          console.log("bookmark modified by user and not program")
        }
      } else if (changeInfo.title.split("|")[1] === undefined && changeInfo.url !== undefined) {
        console.log("bookmark modified by user to be removed from active list title: " + changeInfo.title.split("|")[1] + " url" + changeInfo.url)
        chrome.bookmarks.get(id, (bookmarkArray) => {
          const bookmark = bookmarkArray[0];
          console.log("Bookmark found: " + bookmark.title);

          upToDateBookmarks.delete(changeInfo.title.split("|")[1]);

        });
      }
    } else {
      if (changeInfo.title.split("|")[1] !== undefined && changeInfo.url !== undefined) {
        console.log("bookmark modified by user to be added to active list" + changeInfo.url)
        chrome.bookmarks.get(id, (bookmarkArray) => {
          const bookmark = bookmarkArray[0];
          console.log("Bookmark found: " + bookmark.title);
          upToDateBookmarks.set(changeInfo.title.split("|")[1], bookmark);
        });
      }
    }
  }
}


chrome.bookmarks.onMoved.addListener(handleBookmarkMoved);
// Function to handle bookmark movement within the bookmark tree
function handleBookmarkMoved(id, moveInfo) {

  upToDateBookmarks.forEach((value) => {
    console.log("bookmark kept alive: " + value.id);
  });

  idsOfBookmarksInGoodFolder.forEach((value) => {
    console.log("bookmark in good folder: " + value);
  });


  if (!idsOfBookmarksInGoodFolder.includes(moveInfo.oldParentId)
    && idsOfBookmarksInGoodFolder.includes(moveInfo.parentId)) {
    chrome.bookmarks.get(id, (bookmarkArray) => {
      const bookmark = bookmarkArray[0];
      if (bookmark !== undefined && bookmark.title.split("|")[1] !== undefined) {
        console.log("trouvé ajouté " + bookmark.title + " avec l'id " + bookmark.id)
        upToDateBookmarks.set(bookmark.title.split("|")[1], bookmark);
        idsOfBookmarksInGoodFolder.push(id)
      }
    });
  } else if (idsOfBookmarksInGoodFolder.includes(moveInfo.oldParentId)
    && !idsOfBookmarksInGoodFolder.includes(moveInfo.parentId)) {
    chrome.bookmarks.get(id, (bookmarkArray) => {

      const bookmark = bookmarkArray[0];
      console.log("trouvé retirer " + bookmark.title + " id " + bookmark.id)

      if (bookmark !== undefined && bookmark.title.split("|")[1] !== undefined) {
        upToDateBookmarks.delete(bookmark.title.split("|")[1]);

        var index = idsOfBookmarksInGoodFolder.indexOf(id);
        idsOfBookmarksInGoodFolder.splice(index, 1);
      }
    });
  }
}

