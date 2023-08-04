# UpdatedBookmarks
Keeps bookmarks updated in a folder named UpdatedBookmarks.
To be active title of bookmarks needs to follow the format: 
nameOfBookmark |http://url/You/Want/To/Folow.com/specificElement

"specificElement" should be specific to the book/scan you are reading but should not contain the page number !
exemple: 
Walking One's Own Path |https://www.webtoons.com/en/fantasy/the-lazy-lord-masters-the-sword/s
The full url of the site is :
https://www.webtoons.com/en/fantasy/the-lazy-lord-masters-the-sword/s2-ep-83-checking-out-the-past-2/viewer?title_no=3349&episode_no=84
every urlChange will be caught since it is '/s...' but you will not change the bookmark once you go back to the menu of that manga.

uses :
chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) to change the url of the bookmarks
