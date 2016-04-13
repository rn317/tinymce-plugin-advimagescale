When developing a custom CMS with [TinyMCE](http://tinymce.moxiecode.com/) for a company project, I found that scaling/resizing an image in the TinyMCE editor allows stretching/skewing an image in a way that distorts image aspect ratio.  Finding this to be an odd 'default' behavior, I developed this plugin.

The default behavior of **tinymce-plugin-advimagescale** solves the problem by:
  * **Maintaining aspect ratio on image scaling** by watching for image resize events and preserving the "most changed" dimension and adjusting the other to maintain aspect ratio
  * **Working around browser bugs** in the UI that make resizing problematic.

Optional features include:
  * Enforce a **minimum/maximum image dimensions**
  * **Append width and height dimensions** to the <img> src path to allow a dynamic server-side script to perform automatic resampling on the image (i.e. via <a href='http://www.imagemagick.org/script/index.php'>imagemagick</a> or <a href='http://www.php.net/manual/en/book.image.php'>GD2</a>)<br>
<ul><li>(for example, a URL such as <a href='http://www.mydomain.com/picture.php?id=123'>http://www.mydomain.com/picture.php?id=123</a> would be changed to <a href='http://www.mydomain.com/picture.php?id=123&w=200&h=400'>http://www.mydomain.com/picture.php?id=123&amp;w=200&amp;h=400</a> to indicate an image scaled to 200x400)<br>
</li></ul><ul><li><b>Callbacks</b> for image events including <b>loading</b>, <b>loaded</b> and <b>resize</b> events - this allows you to build your own custom handling for image events in the editor and access image properties.</li></ul>

Soruce is available for check-out via <a href='http://code.google.com/p/tinymce-plugin-advimagescale/source/checkout'>SVN</a>.  There are no zipped downloads for this plugin - simply check-out the source via SVN or download via the code browser. See the <a href='Usage.md'>Usage</a> page<br>
for full instructions.<br>
<br>
Tested only IE7, IE8 and Firefox 3 on Windows Vista & Windows 7.  Google Chrome/Webkit (and therefore Safari as well) do not presently support image scaling in designMode, so this plugin does not apply).  Patches are welcome.<br>
<br>
If you find a bug, please submit it using the issue tracker tab (above).<br>
<br>
<b>REQUIRES TINYMCE VERSION 3.3 OR BETTER</b>

<img src='http://www.gnu.org/graphics/lgplv3-88x31.png' />