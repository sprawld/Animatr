# Animatr

Animatr is a jQuery plugin that allows you to create CSS3 animations using only HTML5 data-attributes. 

 * Lay out your animation timeline using percentages, _or_ seconds or both.
 * No more @keyframes or browser prefixing
 * Run multiple animations simultaneously

Animatr's data-attributes style, and name, are inspired by the wonderful [Skrollr](https://github.com/Prinzhorn/skrollr). It uses [jQuery-Keyframes](https://github.com/jQueryKeyframes/jQuery.Keyframes) and [PrefixFree](http://leaverou.github.io/prefixfree/)

## Quick Start

Include jQuery and Animatr. If your objects's initial positions are specified in the animation, but not in your CSS, then place the script in the `<head>` to avoid page loading artifacts.

```html
<script src="http://code.jquery.com/jquery-1.11.1.min.js"></script>
<script src="path/to/animatr.min.js"></script>
<script>
$(function() {
	$.animatr();
});
</script>
```

Then to animate an object, you just need to use `data-t-<seconds>` attributes. For example, let's move a `<div>` right across the screen in 7 seconds:

```html
<div data-t-0="left:0;" data-t-7="left:100%;"></div>
```

You can add as many animation stages as you want, and specify stages in seconds, or with percentages, or mix the two. Have a look at the following example:

```html
<div data-t-0="left:0;" data-t-3.5="left:100%;" data-t-7="left:0;"
	 data-t-0%="background:rgb(0,0,255);" data-t-50%="background:rgb(0,255,0);" data-t-100%="background:rgb(0,0,255);"></div>
```

Both lines refer to the same times. The first line is specified in seconds (note you can use decimals), and moves our `<div>` to the right, then back again in 7 seconds. The second line is in percentages, and changes the background from blue to green, and back. This is specified with percentages.

### Animation Settings

If an animation is specified with seconds, the latest time will be taken as the total animation duration. If you've *only* used percentages, the duration will default to 10 second. You can change this, and any other animation settings using 'main' `data-t` attribute. You don't need to use the _animation-_ prefix:

```html
<div data-t-0%="left:0;" data-t-100%="left:100%;" data-t="duration:30s; iteration-count:infinite;"></div>
```

You can use any Current defaults are:

```css
duration: 10s;
timing-function: ease;
delay: 0s;
iteration-count: 1;		/* animation plays once. Set to infinite to loop animation forever */
direction: normal;
fill-mode: forwards;
```

### Multiple Animations

You can specify multiple animations simultaneously. Simply add new values with prefix: `data-t1-`, `data-t2-`, etc. This can be useful if you want to mix animation loops of different lengths:

```html
<div data-t-0="left:0;" data-t-10="left:100%;"
     data-t2-0="top:0;" data-t2-1="top:20px;" data-t2-2="top:0px;" data-t2="iteration-count:5;"></div>
```

In this example, the first animation `data-t`, moves our `<div>` left-to-right in 10 seconds. At the same time, the second animation `data-t2` wiggles the `<div>` up and down 5 times as it goes along.

## Plugin Options

To run Animatr on the entire page, simply use the global plugin:

```javascript
$(function()
    $.animatr();    // animate all elements with data-t- attributes
});                 // this is the same as $('body *').animatr();
```

You can also run Animatr on just some elements in the DOM. Take care when specifying a class, it may not work how you think:

```javascript
$(function()
    $('.anim').animatr();           // this will animate any element which has the class .anim specified for it
    $('.anim *').animatr();         // this will animate anything inside a container with .anim class
    $('.anim, .anim *').animatr();  // animate both
```

### Options

When you call the plugin you can specify animation settings, or animation keyframes, and apply them to every element selected. Animation settings are in camelCase. 

```javascript
$(selector).animatr( { animation settings },
                     { keyframes } );
```

For example, to set every animation to loop, and every object to change color from blue to green (and back), call the plugin like this:

```javascript
$(function() {
    $.animatr( { iterationCount: 'infinite'},
               { '0%'  : {'background-color':'rgb(0,0,255)'},
                 '50%' : {'background-color':'rgb(0,255,0)'},
                 '100%': {'background-color':'rgb(0,0,255)'}  });
});
```
