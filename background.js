var favoritesList = new Array();
var activeTabs = new Array();

//Loads bookmarks from the specific folder TheScans
chrome.bookmarks.getTree(function (bookmarkTreeNodes) {
  var folder = findFolder(bookmarkTreeNodes[0], "TheScans");
  if (folder) {
    addAllFolder(folder);
  }
});


function addAllFolder(node) {
  if (node.children) {
    for (var i = 0; i < node.children.length; i++) {
      //Start recursive search
      addAllFolder(node.children[i]);
    }
  } else {
    favoritesList.push(node.url);
  }
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

//If tab is created with url from out folder then : we keep track of it and it's url changes.
chrome.tabs.onCreated.addListener(function (tab) {
  // This function will be called when a new tab is created.
  // Pending url will be the one to open the tab
  favoritesList.forEach(element => {
    if (tab.pendingUrl === element) {
      isInFav = true;
      activeTabs.push(tab.id);
    }
  });
});

//We remove it's ID (incase reuse ?)
chrome.tabs.onRemoved.addListener(function (tab) {
  // This function will be called when a new tab is created.
  // Pending url will be the one to open the tab
  activeTabs.forEach(tab => {
    if (tab.id === tab) {
      activeTabs.pop(tab.id);
    }
  });

});

chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
  
  console.log("addListener");
  activeTabs.forEach(element => {
      console.log(activeTabs);    
  });
  console.log(changeInfo.url);
  console.log(changeInfo.url);
  console.log(tab.url);
  console.log(tab.pendingUrl);

  // Check if the URL changed and if there was a redirect
    var isActiveTab = false;
    activeTabs.forEach(element => {
      if (tabId === element) {
        isActiveTab = true;
      }
    });

    if (isInFav) {
      console.log('We must find the good favorite and update it...');

    }
  }

);


// chrome.runtime.onInstalled.addListener(function() {
//   chrome.bookmarks.create({title: 'My Favorites'}, function(bookmarkFolder) {
//     console.log('Created bookmark folder: ' + bookmarkFolder.title);
//   });
// });

// chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
//   if (request.message === 'addFavorite') {
//     chrome.bookmarks.search({title: 'My Favorites'}, function(bookmarks) {
//       if (bookmarks.length > 0) {
//         var bookmarkFolderId = bookmarks[0].id;
//         chrome.bookmarks.create({parentId: bookmarkFolderId, title: request.url, url: request.url}, function(bookmark) {
//           console.log('Added favorite: ' + bookmark.title);
//           sendResponse({message: 'success'});
//         });
//       }
//     });
//     return true;
//   }
//   if (request.message === 'removeFavorite') {
//     chrome.bookmarks.search({title: 'My Favorites'}, function(bookmarks) {
//       if (bookmarks.length > 0) {
//         var bookmarkFolderId = bookmarks[0].id;
//         chrome.bookmarks.search({parentId: bookmarkFolderId, title: request.url}, function(bookmarks) {
//           if (bookmarks.length > 0) {
//             var bookmarkId = bookmarks[0].id;
//             chrome.bookmarks.remove(bookmarkId, function() {
//               console.log('Removed favorite: ' + request.url);
//               sendResponse({message: 'success'});
//             });
//           }
//         });
//       }
//     });
//     return true;
//   }
// });

// chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
//   if (changeInfo.url) {
//     chrome.bookmarks.search({title: 'My Favorites'}, function(bookmarks) {
//       if (bookmarks.length > 0) {
//         var bookmarkFolderId = bookmarks[0].id;
//         chrome.bookmarks.getChildren(bookmarkFolderId, function(children) {
//           for (var i = 0; i < children.length; i++) {
//             var child = children[i];
//             if (child.url === changeInfo.url) {
//               chrome.bookmarks.update(child.id, {title: tab.title});
//             }
//           }
//         });
//       }
//     });
//   }
// });

