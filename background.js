/*
This script is the backbone of the extention: 
Keep the url of your opened bookmarks updated when you advance in your reading
using addListener on chrome.tabs.onUpdated 
*/


//Original point before change due to the plugin
var initialPointBookmarks = new Map();


//The list of all your bookmarks
var upToDateBookmarks = new Map();


//The list of folders/subfolders that are inside UpToDate
var folder = new Array();


//The map of tab if with the coresponding bookmark oppen inside it.
var activeBookmarksbyId = new Map();


//The list of tabs that the plugin cannot activate on
var excludedTabs = new Map();


//The list of tabs that the plugin is activated on
var activeTabs = new Map();




initializeAllFolderAndBookmarks();


//region Initialisation of the existing folders and bookmarks
//Loads bookmarks from the specific folder TheScans
function initializeAllFolderAndBookmarks() {
  upToDateBookmarks = new Map();
  folder = new Array();

  chrome.bookmarks.getTree(function (bookmarkTreeNodes) {
    var folder = findFolder(bookmarkTreeNodes[0], "UpToDate");
    if (folder) {

      addAllFoldersAndBookmarks(folder);
    } else {
      console.log("Poop there is no folder");
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
  return null;//Should be the creation of the said folder...
}


//Adds all the bookmarks even if you have multiple subfolders
function addAllFoldersAndBookmarks(node) {
  if (!node.url) {
    //It is a folder we add it to this list
    folder.push(folder.id)

    for (var i = 0; i < node.children.length; i++) {
      //Start recursive search
      addAllFoldersAndBookmarks(node.children[i]);
    }
  } else {
    let startURL=node.title.split("|")[1];
    upToDateBookmarks.set(startURL, node);
  }
}


//If tab is created with url from out folder then : we keep track of it and it's url changes.
chrome.tabs.onCreated.addListener(function (tab) {
  attachingAndTrackingTab(tab, tab.pendingUrl)

});

//activate if not disabled on that special tab(not here)

//check if the url is an existing element that we can folow


function attachingAndTrackingTab(tab, urlToCheck) {
  // This function will be called when a new tab is created.
  // Pending url will be the one to open the tab
  if (getMatchingUrlBookmark(urlToCheck) != undefined) {
    activeTabs.set(tab.id, tab)
    console.log("onCreated.addListener tabid: " + tab.id + " tab pending url :" + tab.pendingUrl);
  }
}


function getMatchingUrlBookmark(urlToFind) {
  for (const element of upToDateBookmarks.keys()) {
    console.log(element)
    if (urlToFind.includes(element)) {
      console.log("found the bitch");
      return (upToDateBookmarks.get(element));
    }
  }

  return undefined;
}

//We remove it's ID (incase reuse ?)
chrome.tabs.onRemoved.addListener(function (tab) {
  // This function will be called when a new tab is created.
  // Pending url will be the one to open the tab
  if (activeTabs.has(tab.id)) {
    activeTabs.delete(tag.id);
  }
});



//Hapens chen a tab has a change in URL:
// It is here that we want to update the favorite if it is an active tab (avoid looking at every tabs and every url redirect)
chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
  if (changeInfo.url !== undefined && !excludedTabs.has(tabId)) {
      console.log("Modification of url detected changeInfo.url: " + changeInfo.url + " tab.url: " + tab.url);

    var bookmark = getMatchingUrlBookmark(changeInfo.url);
    if (bookmark != undefined) {
      activeTabs.set(tab.id, tab)
      // Update the bookmark using the chrome.bookmarks.update method
      var newURlPropBookmark = {
        url: changeInfo.url
      };
      chrome.bookmarks.update(bookmark.id, newURlPropBookmark, () => {
        // Bookmark updated successfully
        console.log("Bookmark updated successfully tabid: " + tabId + " tab url: " + tab.url + " tab title " + tab.title);
      });
    } else {
      if (activeTabs.has(tabId)) {
        activeTabs.delete(tabId);
      }
    }
  }
});


  // console.log("Modification of url detected changeInfo.url: " + changeInfo.url + " tab.url: " + tab.url);
  // console.log("State of condition url defined " + (changeInfo.url !== undefined));

  // let updatedBookmark = activeBookmarksbyId.get(tabId);
  // console.log("State of condition nouvelle url " + (updatedBookmark.url !== changeInfo.url));

  // if (changeInfo.url !== undefined && updatedBookmark.url !== changeInfo.url) {
  //   updatedBookmark.url = changeInfo.url

  //   console.log("We are in");

  //   const newURlPropBookmark = {
  //     url: updatedBookmark.url
  //   };

  //   // Update the bookmark using the chrome.bookmarks.update method
  //   chrome.bookmarks.update(updatedBookmark.id, newURlPropBookmark, () => {
  //     // Bookmark updated successfully
  //     console.log("Bookmark updated successfully tabid: " + tabId + " tab url: " + tab.url + " tab title " + tab.title);
  //   });
  // }


  // if (activeBookmarksbyId.has(tabId)) {
  //   console.log("Bookmark modification of url detected changeInfo.url: " + changeInfo.url + " tab.url: " + tab.url);
  //   console.log("State of condition url defined " + (changeInfo.url !== undefined));

  //   let updatedBookmark = activeBookmarksbyId.get(tabId);
  //   console.log("State of condition nouvelle url " + (updatedBookmark.url !== changeInfo.url));

  //   if (changeInfo.url !== undefined && updatedBookmark.url !== changeInfo.url) {
  //     updatedBookmark.url = changeInfo.url

  //     console.log("We are in");

  //     const newURlPropBookmark = {
  //       url: updatedBookmark.url
  //     };

  //     // Update the bookmark using the chrome.bookmarks.update method
  //     chrome.bookmarks.update(updatedBookmark.id, newURlPropBookmark, () => {
  //       // Bookmark updated successfully
  //       console.log("Bookmark updated successfully tabid: " + tabId + " tab url: " + tab.url + " tab title " + tab.title);
  //     });
  //   }
  // }
//});







// function handleBookmarkCreated(id, bookmarkInfo) {
//   //Check if it is a bookmark of our elements
//   if (folder.includes(bookmarkInfo.parentId)) {
//     if (!bookmarkInfo.url) {
//       folder.push(id)
//     } else {

//       upToDateBookmarks.push(bookmarkInfo)

//       chrome.tabs.getCurrent(function (tab) {
//         attachingAndTrackingTab(tab, tab.url);
//         console.log("Bookmark Created:", bookmarkInfo);
//       });
//     }
//   }
// }

// // Function to handle bookmark removal
// function handleBookmarkRemoved(id, removeInfo) {
//    //Check if it is a bookmark of our elements
//    if (folder.includes(bookmarkInfo.parentId)) {
//     if (!bookmarkInfo.url) {
//       folder.delete(id)
//     } else {

//       upToDateBookmarks.push(bookmarkInfo)

//       chrome.tabs.getCurrent(function (tab) {
//         attachingAndTrackingTab(tab, tab.url);
//         console.log("Bookmark Created:", bookmarkInfo);
//       });
//     }
//   }
//   console.log("Bookmark Removed:", removeInfo);
//   //check if it is inside the good folder, if yes than remove it from upToDateBookmarks
// }

// // Function to handle bookmark changes (e.g., title or URL change)
// function handleBookmarkChanged(id, changeInfo) {
//   console.log("Bookmark Changed:", changeInfo);
//   //check if it is inside the good folder, if yes than update it from upToDateBookmarks
// }

// // Function to handle bookmark movement within the bookmark tree
// function handleBookmarkMoved(id, moveInfo) {
//   console.log("Bookmark Moved:", moveInfo);
//   //check if it is inside the good folder, update upToDateBookmarks accordingly
// }

// // Add event listeners to monitor bookmark changes
// chrome.bookmarks.onCreated.addListener(handleBookmarkCreated);
// chrome.bookmarks.onRemoved.addListener(handleBookmarkRemoved);
// chrome.bookmarks.onChanged.addListener(handleBookmarkChanged);
// chrome.bookmarks.onMoved.addListener(handleBookmarkMoved);