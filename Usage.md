

# Plugin Usage Instructions #

Start with a working instance of TinyMCE.  Create a folder in the tinyMCE plugins folder called **advimagescale**.  Download the latest plugin source from http://tinymce-plugin-advimagescale.googlecode.com/svn/trunk/editor_plugin_src.js and save the file to plugins/advimagescale/editor\_plugin.js (remember to rename the file from editor\_plugin\_src.js to editor\_plugin.js !).  Finally, add advimagescale to the TinyMCE.init "plugins" configuration parameter as shown in the full example below.

**Note that if you are using any of the `advimagescale_max_*` or `advimagescale_min_*` options and you wish for them to be immediately enforced upon TinyMCE initialization, then you _must_ set the _`cleanup_on_startup`_ configuration option to true.**

By default (with no options set), the plugin manages **all images** in the editor, forcing them to **maintain the same aspect ratio they started with**.

## Full example ##

This is a full example of all possible options (except for the `advimagescale_filter_*` options).   It assumes you have placed the advimagescale folder in your TinyMCE plugins directory.

This example enables all available options and includes some alert() statements to better show you the callback functionality.  In a real world deployment you should remove these alert() statements and also review the descriptions of all options (at the bottom of this page) to determine which options you want enabled.

```
tinyMCE.init({
    mode : "textareas",
    plugins: 'advimagescale',
    cleanup_on_startup: true,
    advimagescale_maintain_aspect_ratio: true, /* this is the default behavior */
    advimagescale_fix_border_glitch: true, /* also the default behavior */
    advimagescale_noresize_all: false, /* set to true to prevent all resizing on images */
    advimagescale_append_to_url: true, /* apply dimensions to image URL on resize */
    advimagescale_url_width_key: 'w',  /* apply width to URL as w= param */
    advimagescale_url_height_key: 'h', /* apply height to URL as h= param */
    advimagescale_max_height: 200, /* limit maximum image height to 200px */
    advimagescale_max_width:  200, /* limit maximum image width to 200px */
    advimagescale_min_height: 20, /* minimum image height is 20px */
    advimagescale_min_width:  20, /* minimum image width is 20px */
    /* call this function when an image is loading */
    advimagescale_loading_callback: function(imgNode) {
        alert(imgNode.src + ' is loading');
    },
    /* call this function when an image is finished loading */
    advimagescale_loaded_callback: function(imgNode) {
        alert(imgNode.src + ' is loaded');
    },
    /* call this function when an image has been resized */
    advimagescale_resize_callback: function(editorInstance, imgNode) {
        alert('resized to ' + imgNode.width + 'x' + imgNode.height);
    }
});

<form>
	<textarea name="content">
		<!-- this image is managed by advimagescale -->
		<img src="http://mydomain.com/dynamic-image.php?id=1234" width="100" height="100" />
		<!-- this image size is locked with mce_noresize and cannot be resized -->
		<img mce_noresize="1" src="http://mydomain.com/images/picture.jpg" width="100" height="100" />
	</textarea>
</form>

```

## Placing advimagescale outside of your TinyMCE plugins folder ##

If you would prefer to place the advimagescale folder outside of your TinyMCE plugins folder, then load it via tinymce.PluginManager.load() and then prefix the plugin name with a dash in the plugins init option:

```
    tinymce.PluginManager.load('advimagescale', '/lib/advimagescale/editor_plugin_src.js');
    tinyMCE.init({
      ...
      plugins: '-advimagescale'
      ...
    });
```

## Prevent image resizing (on some or all images) ##

Prevent image resizing on **specific IMG tags** by setting the mce\_noresize="1" attribute on that IMG tag - for example <img src=''>. Note that the mce_noresize attribute will be removed before saving, so this option will <b>not</b> get saved for future edits.<br>
<br>
Alternately, use <b>advimage_noresize_class</b> to specify a single image class name that is not resizable (i.e. <img src=''>).  The default classname is 'noresize'.<br>
<br>
To <b>prevent all images from being resized</b>, set <b>advimagescale_noresize_all</b> to true (this overrides all other plugin options since disallowing all resizes negates the need for the other features).<br>
<br>
These methods are preferable to the tinyMCE forum suggested method of stripping image width/height attributes because it does not strip these attributes.  (Stripping the width/height attributes results in failure of HTML/XHTML validation and slows down page loading).<br>
<br>
<h2>Restrict by class name</h2>

You may limit the plugin to only manage images with a specific class by using the advimagescale_filter_class configuration option.  For example, to only manage images with the class "scale_me", you would set:<br>
<br>
<pre><code>    tinyMCE.init({<br>
       /* same options as the first example, plus: */<br>
       advimagescale_filter_class: "scale_me"<br>
    });<br>
</code></pre>

<h2>Restrict by image URL with a regular expression</h2>

Instead of limiting by image class name, you may define a regular expression pattern using <b>advimagescale_filter_src</b>.  If the image URL matches the pattern, then it is managed by the plugin.  Both advimagescale_filter_src and advimagescale_filter_class can be used at the same time for additional selectivity, if you require it (i.e. BOTH conditions must match for the image to be managed by the plugin).<br>
<br>
<pre><code>    tinyMCE.init({<br>
        /* sample options as the first example, plus: */<br>
        advimagescale_filter_src: '\\d{3,}' /* image must have at least 3 digits in the URL */<br>
    });<br>
</code></pre>

<h2>All options</h2>
Note: <b>All advimagescale<code>_</code><code>*</code> options are optional.</b>  By default, the plugin only maintains image aspect ratios.  However, additional features exist to <b>restrict image resizing</b> on some or all images, <b>set minimum and maximum dimensions</b>, <b>append image dimensions to the querystring</b>, <b>trigger callbacks on image-related events</b> and <b>filter which images get managed by the plugin</b>.<br>
<br>
<table><thead><th> <b>Configuration option</b> </th><th> <b>Type</b> </th><th> <b>Default</b> </th><th> <b>Description</b> </th></thead><tbody>
<tr><td> <b>Basic functionality</b>  </td><td>             </td><td> </td><td> </td></tr>
<tr><td> advimagescale_maintain_aspect_ratio </td><td> boolean     </td><td> true           </td><td> Whether to maintain image aspect ratio (default true) </td></tr>
<tr><td> advimagescale_fix_border_glitch </td><td> boolean     </td><td> true           </td><td> Fix the bug (described in #2 in the bug list below).  Most users will want this on (the default is true - so it is on by default). </td></tr>
<tr><td> <b>Specify min/max dimensions</b> </td><td>             </td><td> </td><td> </td></tr>
<tr><td> advimagescale_max_height    </td><td> integer     </td><td> not set        </td><td> Set a value to limit the maximum image height of all images </td></tr>
<tr><td> advimagescale_max_width     </td><td> integer     </td><td> not set        </td><td> Set max image width </td></tr>
<tr><td> advimagescale_min_height    </td><td> integer     </td><td> not set        </td><td> Set min image height </td></tr>
<tr><td> advimagescale_min_width     </td><td> integer     </td><td> not set        </td><td> Set min image width </td></tr>
<tr><td> <b>Control which images are managed by plugin</b> </td><td>             </td><td> </td><td> </td></tr>
<tr><td> advimagescale_filter_src    </td><td> string      </td><td> not set        </td><td> A regular expression; all image SRC attributes that match this regexp will be managed by the plugin </td></tr>
<tr><td> advimagescale_filter_class  </td><td> string      </td><td> not set        </td><td> A CSS class name; all IMG tags with this class will be managed by the plugin <i>(if not set, all images are managed by the plugin)</i> </td></tr>
<tr><td> advimagescale_noresize_class </td><td> string      </td><td> 'noresize'     </td><td> A single class name that, if set on an image, tells the plugin to prevent resizing on that image </td></tr>
<tr><td> advimagescale_noresize_all  </td><td> boolean     </td><td> false          </td><td> Set to true to prevent all image resizing in the editor (overrides all other functionality since all resizes will be prevented) </td></tr>
<tr><td> <b>Append image dimensions to resized image URL for server-side processing</b> </td><td>             </td><td> </td><td> </td></tr>
<tr><td> advimagescale_append_to_url </td><td> boolean     </td><td> false          </td><td> Whether to append the image width/height to the IMG SRC. (i.e. <code>http://mydomain.com/images.php?id=123&amp;w=120&amp;h=120</code>). This is used for doing automatic server-side resampling of scaled images </td></tr>
<tr><td> advimagescale_url_width_key </td><td> string      </td><td> 'w'            </td><td> The querystring parameter to use when appending width to the URL - only applicable if <b>advimagescale_append_to_url</b> is true </td></tr>
<tr><td> advimagescale_url_height_key </td><td> string      </td><td> 'h'            </td><td> The querystring parameter to use when appending width to the URL - only applicable if <b>advimagescale_append_to_url</b> is true </td></tr>
<tr><td> <b>Callbacks</b>            </td><td>             </td><td> </td><td> </td></tr>
<tr><td> advimagescale_loading_callback </td><td> function(imageNode) </td><td> not set        </td><td> Callback function, called when an image begins reloading due to change of the image SRC (usually via advimagescale_append_to_url option) passes the DOM image node as parameter (often used to show a "please wait" dialog or disable form submission while an image is resizing in conjuction with the advimagescale_append_to_url option) </td></tr>
<tr><td> advimagescale_loaded_callback </td><td> function(imageNode) </td><td> not set        </td><td> Callback function, called when an image URL has changed (usually via advimagescale_append_to_url) and has completed loading </td></tr>
<tr><td> advimagescale_resize_callback </td><td> function(editorInstance, imageNode) </td><td> not set        </td><td> Callback function, called when an image has been resized and the new dimensions are available (via imageNode.width / imageNode.height) </td></tr></tbody></table>

<h2>Server-side image resampling</h2>

The advimagescale_append_to_url option (and the configurable parameter names with advimagescale_url_width_key and advimagescale_url_height_key) provide a simple solution for auto-rescaling images on the server side.<br>
<br>
For example, you would begin by inserting an dynamic image URL (usually a PHP script) which performs resampling (if necessary) and then redirects to the properly sized image.<br>
<br>
Assuming the initially inserted image had its width and height attributes set to 100x100, advimagescale will immediately rewrite the source URL for that image from:<br>
<br>
<code>http://mydomain.com/image.php?id=123</code>
to<br>
<code>http://mydomain.com/image.php?id=123&amp;w=100&amp;h=100</code>

This signals your "image.php" script that it needs to serve image <code>#</code>123, resampled to 100x100 pixels.<br>
<br>
Now, if the user scales the image up to 500x500, the URL will change to:<br>
<br>
<code>http://mydomain.com/image.php?id=123&amp;w=500&amp;h=500</code>

... and your CMS will now know that it needs to resample the original source image for image <code>#</code>123 to 500x500 pixels, and then redirect to that image so the user receives an updated version to fit the new dimensions.<br>
<br>
This feature is intended to allow seamless scaling up and down of images without loss of quality.  By default, the browser will scale an image but will not resample it from the original, resulting in pixelated or blurry images.  This advanced functionality allows you to resample from a source image (if available) and provide a higher quality image that matches the new dimensions.<br>
<br>
<h2>Callbacks</h2>

Callbacks allow you to be notified when certain events (such as an image begins loading, finishes loading, or is resized) happens in the browser.<br>
<br>
Use the <b>advimagescale_loading_callback</b> and <b>advimagescale_loaded_callback</b> callback options if you'd like to be notified when an image begins reloading and completes reloading, and the <b>advimagescale_resize_callback</b> to be notified when an image has been resized.<br>
<br>
<h2>Bug Fixes</h2>

There are two browser bugs that we discovered while developing this plugin, and have implemented workarounds.  Specifically:<br>
<br>
<ol><li><b>Resize handles do not re-draw in Gecko</b>. When the plugin changes the image dimensions to maintain aspect ratio, Gecko does not move the resize handles to wrap the new image dimensions.  This has been worked around by forcing a redraw of the TinyMCE area.  The side effect is that this de-selects the image.  To continue further resizing, you must re-select the image by clicking on it.<br>
</li><li><b>Resizing an image with a border adds border width to image width</b>.  This occurs only when an image has a border width set via the tinymce content_css directive or via an inline style.  This bug (or unexpected behavior, at least...) is present without this plugin, we are simply working around it here as a convenience.  This is corrected by automatically adjusting the image to reduce its width by the border width after each resize. The consequence in Gecko based browsers is that the image will be de-selected (as the plugin must force a tinyMCE redraw to move the resize handles into the correct location due to gecko <a href='https://code.google.com/p/tinymce-plugin-advimagescale/issues/detail?id=1'>bug #1</a> above).