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


// Usage:
const bookmarkFolderName = 'UpdatedBookmarks';




//The main methode launch to start scan/creation of the folder
getOrCreateBookmarkFolder(bookmarkFolderName, function (folder) {
  console.log(folder.title);
  addAllFoldersAndBookmarks(folder);
});


// Function to get or create the bookmark folder
function getOrCreateBookmarkFolder(folderName, callback) {
  // Check if the folder already exists
  chrome.bookmarks.search({ title: folderName }, function (results) {
    if (results.length > 0) {
      // Folder already exists, use its ID
      const folder = results[0];
      chrome.bookmarks.getChildren(results[0].id, function (children) {
        console.log("children  " + children?.length);
        folder.children = children
        callback(folder);

      })
    } else {
      // Folder doesn't exist, create it
      chrome.bookmarks.create({ title: folderName, parentId: "1" }, function (newFolder) {
        const folder = newFolder;
        callback(folder);
      });
    }
  });
}



//Adds all the bookmarks even if you have multiple subfolders
function addAllFoldersAndBookmarks(node) {
  idsOfBookmarksInGoodFolder.push(node.id)
  console.log("idsOfBookmarksInGoodFolder " + node.id + " " + node.title)

  if (!node.url) {
    console.log("children node " + node.children);
    if (node.children) {
      for (var i = 0; i < node.children.length; i++) {
        //Start recursive search
        addAllFoldersAndBookmarks(node.children[i]);
      }
    }
  } else {
    let startURL = node.title.split("|")[1];
    if (startURL !== undefined) { upToDateBookmarks.set(startURL, node); }
  }
}



function getMatchingUrlBookmark(urlToFind) {
  for (const element of upToDateBookmarks.keys()) {
    console.log("getMatchingUrlBookmark " + element);
    if (urlToFind.includes(element)) {
      console.log("found : " + element);
      return (upToDateBookmarks.get(element));
    }
  }
  return undefined;
}

chrome.tabs.onRemoved.addListener(function (tabid, removeInfo) {
  if (activeTabsId.has(tabid)) {
    activeTabsId.delete(tabid);
  }
});


//Hapens chen a tab has a change in URL:
chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
  if (changeInfo.url != undefined) {
    if (!excludedTabs.has(tabId)) {
      var bookmark = getMatchingUrlBookmark(changeInfo.url);
      if (bookmark != undefined) {
        console.log("tab of interest url changed " + bookmark.title);

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
    let bookmarkInActiveList;
    upToDateBookmarks.forEach((value) => {
      if (value.id === id) {
        bookmarkInActiveList = value;
      }
    });

    if (bookmarkInActiveList !== undefined) {
      if (changeInfo.title.split("|")[1] !== undefined) {
        if (bookmarkInActiveList.url !== changeInfo.url || bookmarkInActiveList.title !== changeInfo.title) {
          console.log("les urls :" + bookmarkInActiveList.url + " " + changeInfo.url + " " + bookmarkInActiveList.title + " " + changeInfo.title)
          bookmarkInActiveList.title = changeInfo.title.split("|")[1];
          bookmarkInActiveList.url = changeInfo.url;
          console.log("bookmark modified in upToDateBookmarks")
        }
      } else if (changeInfo.title.split("|")[1] === undefined && changeInfo.url !== undefined) {
        console.log("bookmark modified by user to be removed from active list title changeInfo: " + changeInfo.title + " url " + changeInfo.url);
        console.log("bookmark modified by user to be removed from active list title bookmarkInActiveList: " + bookmarkInActiveList.title + " url" + bookmarkInActiveList.url);
        chrome.bookmarks.get(id, (bookmarkArray) => {
          const bookmark = bookmarkArray[0];
          console.log("Bookmark found to delete: " + bookmarkInActiveList.title);

          var keyToDeletElement;
          upToDateBookmarks.forEach((value, key) => {
            if (value.id == id) {
              keyToDeletElement = key;
            }
            console.log("value before delete " + value.title);
          });
          upToDateBookmarks.delete(keyToDeletElement);

          upToDateBookmarks.forEach((value) => {

            console.log("value after delete " + value.title);
          });

        });
      }
    } else {
      if (changeInfo.title.split("|")[1] !== undefined && changeInfo.url !== undefined) {
        chrome.bookmarks.get(id, (bookmarkArray) => {
          const bookmark = bookmarkArray[0];
          console.log("Bookmark found here: " + bookmark.title);
          upToDateBookmarks.set(bookmark.title.split("|")[1], bookmark);
        });
      }
    }
  }
}


chrome.bookmarks.onMoved.addListener(handleBookmarkMoved);
// Function to handle bookmark movement within the bookmark tree
function handleBookmarkMoved(id, moveInfo) {
  if (!idsOfBookmarksInGoodFolder.includes(moveInfo.oldParentId)
    && idsOfBookmarksInGoodFolder.includes(moveInfo.parentId)) {
    chrome.bookmarks.get(id, (bookmarkArray) => {
      const bookmark = bookmarkArray[0];
      if (bookmark !== undefined && bookmark.title.split("|")[1] !== undefined) {
        upToDateBookmarks.set(bookmark.title.split("|")[1], bookmark);
        idsOfBookmarksInGoodFolder.push(id)
      }
    });
  } else if (idsOfBookmarksInGoodFolder.includes(moveInfo.oldParentId)
    && !idsOfBookmarksInGoodFolder.includes(moveInfo.parentId)) {
    chrome.bookmarks.get(id, (bookmarkArray) => {
      const bookmark = bookmarkArray[0];
      if (bookmark !== undefined && bookmark.title.split("|")[1] !== undefined) {
        upToDateBookmarks.delete(bookmark.title.split("|")[1]);

        upToDateBookmarks.forEach((value) => {
          console.log("value after delet" + value.title);
        });
        var index = idsOfBookmarksInGoodFolder.indexOf(id);
        idsOfBookmarksInGoodFolder.splice(index, 1);
      }
    });
  }
}