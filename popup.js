document.addEventListener('DOMContentLoaded', function() {
    var addFavoriteForm = document.getElementById('add-favorite-form');
    var favoritesList = document.getElementById('favorites-list');
  

    //Loads bookmarks from the specific folder TheScans
    chrome.bookmarks.getTree(function (bookmarkTreeNodes) {
      var folder = findFolder(bookmarkTreeNodes[0], "TheScans");
      if (folder) {
        addAllFolder(folder);
        // for (var i = 0; i < folder.children.length; i++) {
        //   if(folder.children[i].children){
        //     //addElementToList(folder.children[i])
        //   } else{
        //     addElementToList(folder.children[i])
        //   } 
        // }   
      }
    });
    
    function addElementToList(bookmarkTreeNode)
    {
      var favorite = bookmarkTreeNode.url;
      var listItem = document.createElement('li');
      var link = document.createElement('a');
      link.setAttribute('href', favorite);
      link.textContent = favorite;
      listItem.appendChild(link);
      favoritesList.appendChild(listItem);   
    }



    function addAllFolder(node) {
      if (node.children) {
        for (var i = 0; i < node.children.length; i++) {
           //Add a folder to the list
          addFolderToVisual(node);
          //Start recursive search
          addAllFolder(node.children[i]);
      
        }
      }else{
        addElementToList(node);
      }
    }

    function addFolderToVisual(node){
      var favorite = node.title;
      var listItem = document.createElement('div');
      var link = document.createElement('a');
      link.setAttribute('href', favorite);
      link.textContent = favorite;
      listItem.appendChild(link);
      favoritesList.appendChild(listItem);   
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


  
    // Handle form submission
    addFavoriteForm.addEventListener('submit', function(event) {
      event.preventDefault();
      var urlInput = document.getElementById('url-input');
      var favoriteUrl = urlInput.value.trim();
      if (favoriteUrl) {
        chrome.storage.sync.get('scanFolder', function(data) {
          var favorites = data.scanFolder || [];
          favorites.push(favoriteUrl);
          chrome.storage.sync.set({'scanFolder': favorites}, function() {
            var listItem = document.createElement('li');
            var link = document.createElement('a');
            link.setAttribute('href', favoriteUrl);
            link.textContent = favoriteUrl;
            listItem.appendChild(link);
            favoritesList.appendChild(listItem);
            urlInput.value = '';
          });
        });
      }
    });
  });