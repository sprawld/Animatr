# Animatr

Animatr is a jQuery plugin that allows you to create CSS3 animations using only HTML5 data-attributes.

 * Lay out your animation steps by time (in seconds), percentages, or both.
 * No more @keyframes or browser prefixing
 * Run multiple animations simultaneously in one element

Animatr's data-attributes style, and name, are inspired by the wonderful [Skrollr](https://github.com/Prinzhorn/skrollr). It requires [jQuery-Keyframes](https://github.com/jQueryKeyframes/jQuery.Keyframes) and [PrefixFree](http://leaverou.github.io/prefixfree/). These are packaged in the minified version.

## Quick Start

Include jQuery and Animatr. To animate the entire page, just call the global function `$.animatr()`

```html
<script src="http://code.jquery.com/jquery-1.11.1.min.js"></script>
<script src="path/to/animatr.min.js"></script>
<script>
$(function() {
    $.animatr();
});
</script>
```

Then to animate an object, you just need to use attributes of the form: `data-t-<seconds>`. For example, let's move a `<div>` 500 pixels right in 10 seconds:

```html
<div data-t-0="left:0;" data-t-10="left:500px;"></div>
```

### Creating an animation timeline

You can add as many animation stages as you want, and specify stages in seconds, or with percentages, or mix the two. Have a look at the following example:

```html
<div data-t-0="left:0px;" data-t-5="left:500px;"
     data-t-0%="transform:rotate(0deg);"
     data-t-50%="transform:rotate(180deg);"
     data-t-100%="transform:rotate(180deg);"></div>
```

The first line is specified in seconds (note that you can use decimals), and moves our `<div>` to the right in 2.5 seconds, then back again. Since 5 seconds is the largest time specified, this is the duration of the animation.

The second line is specified in percentages, and rotates the `<div>` in the first half of the animation. In this case, this will occur at 50% = 2.5 seconds.

### Animation Settings

If you only use percentages, the animation duration will default to 10 second. You can change this, and any other [animation settings](http://www.w3.org/TR/css3-animations/#contents) using the root `data-t` attribute. You don't need to use the _animation-_ prefix in this pseudo-CSS:

```html

<div data-t-0%="left:0;" data-t-100%="left:500px;"
     data-t="duration:5s;delay:5s;"></div>
```

The current defaults are:

```css
duration: 10s;
timing-function: ease;
delay: 0s;
iteration-count: 1;
direction: normal;
fill-mode: forwards;
```

By default the animation plays once. To loop the animation forever, set `iteration-count: infinite`, or use the shorthand attribute `data-t-loop`

```html
<div data-t-0%="left:0;" data-t-100%="left:500px;"
     data-t="duration:3s;direction:alternate;"
     data-t-loop ></div>
```
### Keyframes

You can mix in CSS @keyframes to your animation - this can be useful if you're reusing the same effect over and over. Just specify the keyframes in your CSS (you only need to use the W3C non-prefixed @keyframes). And since we're making up pseudo-CSS anyway, lets add a new attribute: `keyframes`

```html
<style>
  @keyframes colorchange {
     0% { background-color:rgb(140,140,255); }
   100% { background-color:rgb(140,255,140); }
  }
</style>

< div data-t-5="transform:rotate(180deg);"
      data-t="keyframes:colorchange;">

```

You can add multiple keyframes, separated by a space. Animatr will mix together any keyframes that it can read directly - ones specified before the script is run, and with [CORS](https://developer.mozilla.org/en-US/docs/Web/HTTP/Access_control_CORS) enabled - into one animation. Any @keyframes it can't read directly will still be run. 


### Multiple Animations

You can specify multiple animations to run simultaneously, or sequence them one after another with delays. Simply add a positive number after the t: `data-t1-`, `data-t2-`, etc. Each animation can be given its own settings and keyframes. This can be useful if you want to mix animation loops of different lengths:

```html
<div data-t-0="left:0;" data-t-10="left:100%;"
     data-t2-0="top:0;" data-t2-2="top:0;"
     data-t2-25%="top:-20px;" data-t2-75%="top:20%;"
	 data-t2-loop="5"></div>
```

In this example, the first animation `data-t`, moves our `<div>` left-to-right in 10 seconds. At the same time, the second animation `data-t2` wiggles the `<div>` up and down 5 times as it goes along.

**Be careful not to specify the same CSS attributes in different animations, browsers don't like that.**


## Plugin

To run Animatr on the entire page, simply use the global plugin:

```javascript
$.animatr(); // animate all elements with data-t- attribute.
             // this is the same as $('body *').animatr();
```

You can also run Animatr on just some elements in the DOM. Take care when specifying a class, it may not work how you think:

```html
<div class="container" id="a">
    <div id="b"></div>
    <div id="c"></div>
</div>
```

```javascript
$('.container').animatr();   // animate only the container (a)
$('.container *').animatr(); // animate contents of container (b & c)
$('div').animatr();          // animate all divs (a, b & c)
```

### Options

Animatr accepts global animation settings. These will be overwritten by any elements' local settings in `data-t` (etc). Keyframes will all be added together.

```javascript
$('selector').animatr( "keyframes:colorchange;iteration-count:infinite;" );
```

#### Shortcuts

There are also a few shortcut methods to pause, unpause or restart the animation:

````javascript
$.animatr("pause");   // pause all animations
$.animatr("play");    // unpause animations
$.animatr("restart"); // restart animations from the beginning
```

