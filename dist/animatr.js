/**
 * StyleFix 1.0.3 & PrefixFree 1.0.7
 * @author Lea Verou
 * MIT license
 */

(function(){

if(!window.addEventListener) {
	return;
}

var self = window.StyleFix = {
	link: function(link) {
		try {
			// Ignore stylesheets with data-noprefix attribute as well as alternate stylesheets
			if(link.rel !== 'stylesheet' || link.hasAttribute('data-noprefix')) {
				return;
			}
		}
		catch(e) {
			return;
		}

		var url = link.href || link.getAttribute('data-href'),
		    base = url.replace(/[^\/]+$/, ''),
		    base_scheme = (/^[a-z]{3,10}:/.exec(base) || [''])[0],
		    base_domain = (/^[a-z]{3,10}:\/\/[^\/]+/.exec(base) || [''])[0],
		    base_query = /^([^?]*)\??/.exec(url)[1],
		    parent = link.parentNode,
		    xhr = new XMLHttpRequest(),
		    process;
		
		xhr.onreadystatechange = function() {
			if(xhr.readyState === 4) {
				process();
			}
		};

		process = function() {
				var css = xhr.responseText;
				
				if(css && link.parentNode && (!xhr.status || xhr.status < 400 || xhr.status > 600)) {
					css = self.fix(css, true, link);
					
					// Convert relative URLs to absolute, if needed
					if(base) {
						css = css.replace(/url\(\s*?((?:"|')?)(.+?)\1\s*?\)/gi, function($0, quote, url) {
							if(/^([a-z]{3,10}:|#)/i.test(url)) { // Absolute & or hash-relative
								return $0;
							}
							else if(/^\/\//.test(url)) { // Scheme-relative
								// May contain sequences like /../ and /./ but those DO work
								return 'url("' + base_scheme + url + '")';
							}
							else if(/^\//.test(url)) { // Domain-relative
								return 'url("' + base_domain + url + '")';
							}
							else if(/^\?/.test(url)) { // Query-relative
								return 'url("' + base_query + url + '")';
							}
							else {
								// Path-relative
								return 'url("' + base + url + '")';
							}
						});

						// behavior URLs shoudn’t be converted (Issue #19)
						// base should be escaped before added to RegExp (Issue #81)
						var escaped_base = base.replace(/([\\\^\$*+[\]?{}.=!:(|)])/g,"\\$1");
						css = css.replace(RegExp('\\b(behavior:\\s*?url\\(\'?"?)' + escaped_base, 'gi'), '$1');
						}
					
					var style = document.createElement('style');
					style.textContent = css;
					style.media = link.media;
					style.disabled = link.disabled;
					style.setAttribute('data-href', link.getAttribute('href'));
					
					parent.insertBefore(style, link);
					parent.removeChild(link);
					
					style.media = link.media; // Duplicate is intentional. See issue #31
				}
		};

		try {
			xhr.open('GET', url);
			xhr.send(null);
		} catch (e) {
			// Fallback to XDomainRequest if available
			if (typeof XDomainRequest != "undefined") {
				xhr = new XDomainRequest();
				xhr.onerror = xhr.onprogress = function() {};
				xhr.onload = process;
				xhr.open("GET", url);
				xhr.send(null);
			}
		}
		
		link.setAttribute('data-inprogress', '');
	},

	styleElement: function(style) {
		if (style.hasAttribute('data-noprefix')) {
			return;
		}
		var disabled = style.disabled;
		
		style.textContent = self.fix(style.textContent, true, style);
		
		style.disabled = disabled;
	},

	styleAttribute: function(element) {
		var css = element.getAttribute('style');
		
		css = self.fix(css, false, element);
		
		element.setAttribute('style', css);
	},
	
	process: function() {
		// Linked stylesheets
		$('link[rel="stylesheet"]:not([data-inprogress])').forEach(StyleFix.link);
		
		// Inline stylesheets
		$('style').forEach(StyleFix.styleElement);
		
		// Inline styles
		$('[style]').forEach(StyleFix.styleAttribute);
	},
	
	register: function(fixer, index) {
		(self.fixers = self.fixers || [])
			.splice(index === undefined? self.fixers.length : index, 0, fixer);
	},
	
	fix: function(css, raw, element) {
		for(var i=0; i<self.fixers.length; i++) {
			css = self.fixers[i](css, raw, element) || css;
		}
		
		return css;
	},
	
	camelCase: function(str) {
		return str.replace(/-([a-z])/g, function($0, $1) { return $1.toUpperCase(); }).replace('-','');
	},
	
	deCamelCase: function(str) {
		return str.replace(/[A-Z]/g, function($0) { return '-' + $0.toLowerCase() });
	}
};

/**************************************
 * Process styles
 **************************************/
(function(){
	setTimeout(function(){
		$('link[rel="stylesheet"]').forEach(StyleFix.link);
	}, 10);
	
	document.addEventListener('DOMContentLoaded', StyleFix.process, false);
})();

function $(expr, con) {
	return [].slice.call((con || document).querySelectorAll(expr));
}

})();

/**
 * PrefixFree
 */
(function(root){

if(!window.StyleFix || !window.getComputedStyle) {
	return;
}

// Private helper
function fix(what, before, after, replacement, css) {
	what = self[what];
	
	if(what.length) {
		var regex = RegExp(before + '(' + what.join('|') + ')' + after, 'gi');

		css = css.replace(regex, replacement);
	}
	
	return css;
}

var self = window.PrefixFree = {
	prefixCSS: function(css, raw, element) {
		var prefix = self.prefix;
		
		// Gradient angles hotfix
		if(self.functions.indexOf('linear-gradient') > -1) {
			// Gradients are supported with a prefix, convert angles to legacy
			css = css.replace(/(\s|:|,)(repeating-)?linear-gradient\(\s*(-?\d*\.?\d*)deg/ig, function ($0, delim, repeating, deg) {
				return delim + (repeating || '') + 'linear-gradient(' + (90-deg) + 'deg';
			});
		}
		
		css = fix('functions', '(\\s|:|,)', '\\s*\\(', '$1' + prefix + '$2(', css);
		css = fix('keywords', '(\\s|:)', '(\\s|;|\\}|$)', '$1' + prefix + '$2$3', css);
		css = fix('properties', '(^|\\{|\\s|;)', '\\s*:', '$1' + prefix + '$2:', css);
		
		// Prefix properties *inside* values (issue #8)
		if (self.properties.length) {
			var regex = RegExp('\\b(' + self.properties.join('|') + ')(?!:)', 'gi');
			
			css = fix('valueProperties', '\\b', ':(.+?);', function($0) {
				return $0.replace(regex, prefix + "$1")
			}, css);
		}
		
		if(raw) {
			css = fix('selectors', '', '\\b', self.prefixSelector, css);
			css = fix('atrules', '@', '\\b', '@' + prefix + '$1', css);
		}
		
		// Fix double prefixing
		css = css.replace(RegExp('-' + prefix, 'g'), '-');
		
		// Prefix wildcard
		css = css.replace(/-\*-(?=[a-z]+)/gi, self.prefix);
		
		return css;
	},
	
	property: function(property) {
		return (self.properties.indexOf(property) >=0 ? self.prefix : '') + property;
	},
	
	value: function(value, property) {
		value = fix('functions', '(^|\\s|,)', '\\s*\\(', '$1' + self.prefix + '$2(', value);
		value = fix('keywords', '(^|\\s)', '(\\s|$)', '$1' + self.prefix + '$2$3', value);

		if(self.valueProperties.indexOf(property) >= 0) {
			value = fix('properties', '(^|\\s|,)', '($|\\s|,)', '$1'+self.prefix+'$2$3', value);
		}

		return value;
	},
	
	// Warning: Prefixes no matter what, even if the selector is supported prefix-less
	prefixSelector: function(selector) {
		return selector.replace(/^:{1,2}/, function($0) { return $0 + self.prefix })
	},
	
	// Warning: Prefixes no matter what, even if the property is supported prefix-less
	prefixProperty: function(property, camelCase) {
		var prefixed = self.prefix + property;
		
		return camelCase? StyleFix.camelCase(prefixed) : prefixed;
	}
};

/**************************************
 * Properties
 **************************************/
(function() {
	var prefixes = {},
		properties = [],
		shorthands = {},
		style = getComputedStyle(document.documentElement, null),
		dummy = document.createElement('div').style;
	
	// Why are we doing this instead of iterating over properties in a .style object? Cause Webkit won't iterate over those.
	var iterate = function(property) {
		if(property.charAt(0) === '-') {
			properties.push(property);
			
			var parts = property.split('-'),
				prefix = parts[1];
				
			// Count prefix uses
			prefixes[prefix] = ++prefixes[prefix] || 1;
			
			// This helps determining shorthands
			while(parts.length > 3) {
				parts.pop();
				
				var shorthand = parts.join('-');

				if(supported(shorthand) && properties.indexOf(shorthand) === -1) {
					properties.push(shorthand);
				}
			}
		}
	},
	supported = function(property) {
		return StyleFix.camelCase(property) in dummy;
	}
	
	// Some browsers have numerical indices for the properties, some don't
	if(style.length > 0) {
		for(var i=0; i<style.length; i++) {
			iterate(style[i])
		}
	}
	else {
		for(var property in style) {
			iterate(StyleFix.deCamelCase(property));
		}
	}

	// Find most frequently used prefix
	var highest = {uses:0};
	for(var prefix in prefixes) {
		var uses = prefixes[prefix];

		if(highest.uses < uses) {
			highest = {prefix: prefix, uses: uses};
		}
	}
	
	self.prefix = '-' + highest.prefix + '-';
	self.Prefix = StyleFix.camelCase(self.prefix);
	
	self.properties = [];

	// Get properties ONLY supported with a prefix
	for(var i=0; i<properties.length; i++) {
		var property = properties[i];
		
		if(property.indexOf(self.prefix) === 0) { // we might have multiple prefixes, like Opera
			var unprefixed = property.slice(self.prefix.length);
			
			if(!supported(unprefixed)) {
				self.properties.push(unprefixed);
			}
		}
	}
	
	// IE fix
	if(self.Prefix == 'Ms' 
	  && !('transform' in dummy) 
	  && !('MsTransform' in dummy) 
	  && ('msTransform' in dummy)) {
		self.properties.push('transform', 'transform-origin');	
	}
	
	self.properties.sort();
})();

/**************************************
 * Values
 **************************************/
(function() {
// Values that might need prefixing
var functions = {
	'linear-gradient': {
		property: 'backgroundImage',
		params: 'red, teal'
	},
	'calc': {
		property: 'width',
		params: '1px + 5%'
	},
	'element': {
		property: 'backgroundImage',
		params: '#foo'
	},
	'cross-fade': {
		property: 'backgroundImage',
		params: 'url(a.png), url(b.png), 50%'
	}
};


functions['repeating-linear-gradient'] =
functions['repeating-radial-gradient'] =
functions['radial-gradient'] =
functions['linear-gradient'];

// Note: The properties assigned are just to *test* support. 
// The keywords will be prefixed everywhere.
var keywords = {
	'initial': 'color',
	'zoom-in': 'cursor',
	'zoom-out': 'cursor',
	'box': 'display',
	'flexbox': 'display',
	'inline-flexbox': 'display',
	'flex': 'display',
	'inline-flex': 'display',
	'grid': 'display',
	'inline-grid': 'display',
	'min-content': 'width'
};

self.functions = [];
self.keywords = [];

var style = document.createElement('div').style;

function supported(value, property) {
	style[property] = '';
	style[property] = value;

	return !!style[property];
}

for (var func in functions) {
	var test = functions[func],
		property = test.property,
		value = func + '(' + test.params + ')';
	
	if (!supported(value, property)
	  && supported(self.prefix + value, property)) {
		// It's supported, but with a prefix
		self.functions.push(func);
	}
}

for (var keyword in keywords) {
	var property = keywords[keyword];

	if (!supported(keyword, property)
	  && supported(self.prefix + keyword, property)) {
		// It's supported, but with a prefix
		self.keywords.push(keyword);
	}
}

})();

/**************************************
 * Selectors and @-rules
 **************************************/
(function() {

var 
selectors = {
	':read-only': null,
	':read-write': null,
	':any-link': null,
	'::selection': null
},

atrules = {
	'keyframes': 'name',
	'viewport': null,
	'document': 'regexp(".")'
};

self.selectors = [];
self.atrules = [];

var style = root.appendChild(document.createElement('style'));

function supported(selector) {
	style.textContent = selector + '{}';  // Safari 4 has issues with style.innerHTML
	
	return !!style.sheet.cssRules.length;
}

for(var selector in selectors) {
	var test = selector + (selectors[selector]? '(' + selectors[selector] + ')' : '');
		
	if(!supported(test) && supported(self.prefixSelector(test))) {
		self.selectors.push(selector);
	}
}

for(var atrule in atrules) {
	var test = atrule + ' ' + (atrules[atrule] || '');
	
	if(!supported('@' + test) && supported('@' + self.prefix + test)) {
		self.atrules.push(atrule);
	}
}

root.removeChild(style);

})();

// Properties that accept properties as their value
self.valueProperties = [
	'transition',
	'transition-property'
]

// Add class for current prefix
root.className += ' ' + self.prefix;

StyleFix.register(self.prefixCSS);


})(document.documentElement);

(function() {
    var animationSupport = false,
        animationString = 'animation',
        vendorPrefix = prefix = '',
        domPrefixes = ['Webkit', 'Moz', 'O', 'ms', 'Khtml'];

    $(window).load(function(){
        var body = document.body;
        if( body.style.animationName !== undefined ) { animationSupport = true; }

        if( animationSupport === false ) {
            for( var i = 0; i < domPrefixes.length; i++ ) {
                if( body.style[ domPrefixes[i] + 'AnimationName' ] !== undefined ) {
                    prefix = domPrefixes[ i ];
                    animationString = prefix + 'Animation';
                    vendorPrefix = '-' + prefix.toLowerCase() + '-';
                    animationSupport = true;
                    break;
                }
            }
        }
    });


    var $createKeyframeStyleTag = function(id) {
        return $("<style>").attr({
            class: "keyframe-style",
            id: id,
            type: "text/css"
        }).appendTo("head");
    };

    $.keyframe = {
        getVendorPrefix: function() {
            return vendorPrefix;
        },
        isSupported: function() {
            return animationSupport;
        },
        generate: function(frameData) {
            var frameName = frameData.name || "";
            var css = "@" + vendorPrefix + "keyframes " + frameName + " {";

            for (var key in frameData) {
                if (key !== "name") {
                    css += key + " {";

                    for (var property in frameData[key]) {
                        css += property + ":" + frameData[key][property] + ";";
                    }

                    css += "}";
                }
            }

            css = PrefixFree.prefixCSS(css + "}");

            var $frameStyle = $("style#" + frameData.name);

            if ($frameStyle.length > 0) {
                $frameStyle.html(css);

                var $elems = $("*").filter(function() {
                    this.style[animationString + "Name"] === frameName;
                });

                $elems.each(function() {
                    var $el, options;
                    $el = $(this);
                    options = $el.data("keyframeOptions");
                    $el.resetKeyframe(function() {
                        $el.playKeyframe(options);
                    });
                });
            } else {
                $createKeyframeStyleTag(frameName).append(css);
            }
        },
        define: function(frameData) {
            if (frameData.length) {
                for (var i = 0; i < frameData.length; i++) {
                    var frame = frameData[i];
                    this.generate(frame);
                }
            } else {
                this.generate(frameData);
            }
        }
    };

    var animationPlayState = "animation-play-state";
    var playStateRunning = "running";

    $.fn.resetKeyframe = function(callback) {
        var $el = $(this).css(vendorPrefix + animationPlayState, playStateRunning).css(vendorPrefix + "animation", "none");

        if (callback) {
            setTimeout(callback, 1);
        }
    };

    $.fn.pauseKeyframe = function() {
        $(this).css(vendorPrefix + animationPlayState, "paused");
    };

    $.fn.resumeKeyframe = function() {
        $(this).css(vendorPrefix + animationPlayState, playStateRunning);
    };

    $.fn.playKeyframe = function(frameOptions, callback) {

        var animObjToStr = function(obj){
            obj = $.extend({
                duration: 0,
                timingFunction: "ease",
                delay: 0,
                iterationCount: 1,
                direction: "normal",
                fillMode: "forwards"
            }, obj);
            return [obj.name, obj.duration, obj.timingFunction, obj.delay, obj.iterationCount, obj.direction, obj.fillMode].join(" ");
        };

        var animationcss = "";

        if($.isArray(frameOptions)){
            var frameOptionsStrings = [];
            for(var i = 0; i < frameOptions.length; i++){
                if (typeof frameOptions[i] === 'string') {
                    frameOptionsStrings.push(frameOptions[i]);
                }else{
                    frameOptionsStrings.push(animObjToStr(frameOptions[i]));
                }
            }
            animationcss = frameOptionsStrings.join(", ");
        }else if (typeof frameOptions === 'string') {
            animationcss = frameOptions;
        }else{
            animationcss = animObjToStr(frameOptions);
        }

        var animationkey = vendorPrefix + "animation";
        var pfx = ["webkit", "moz", "MS", "o", ""];

        var _prefixEvent = function(element, type, callback) {
            for(var i = 0; i < pfx.length; i++){
                if (!pfx[i]) {
                    type = type.toLowerCase();
                }
                var evt = pfx[i] + type;
                element.off(evt).on(evt, callback);
            }
        };

        this.each(function() {
            var $el = $(this).addClass("boostKeyframe").css(vendorPrefix + animationPlayState, playStateRunning).css(animationkey, animationcss).data("keyframeOptions", frameOptions);

            if (callback) {
                _prefixEvent($el, 'AnimationIteration', callback);
                _prefixEvent($el, 'AnimationEnd', callback);
            }
        });
        return this;
    };

    $createKeyframeStyleTag("boost-keyframe").append(" .boostKeyframe{" + vendorPrefix + "transform:scale3d(1,1,1);}");

}).call(this);

/*!
* Animatr v0.1.0 - CSS3 animations with HTML5 data-attributes
* Copyright 2014 @sprawld http://sprawledoctopus.com/animatr/
* MIT License. Requires jQuery.Keyframes & PrefixFree
*/

;(function ( $, window, document, undefined ) {
	'use strict';
	
    $.fn.animatr = function(opts) {
		return Animatr(this,opts);
	}
	
	$.animatr = function(opts) {
		return Animatr(this('body *'),opts);
	}

	
	// Plugin data:
	var global = {
		keyframes: getKeyframes(),	//object with @keyframes read from CSS
		animations: []				//array with new keyframes created by Animatr
	};	

	
	// Library functions:

	// Merge - used to combine two Keyframe objects.
	function merge(obj1, obj2) {
		for(var attrname in obj2) {
			if(obj1.hasOwnProperty(attrname) ) obj1[attrname] = $.extend(obj1[attrname],obj2[attrname]);
			else obj1[attrname] = obj2[attrname];
		}
	}

	
	// Convert CSS string to Object:
	
	// Convert keyframe string into an object
	function getKeyframeObj(text) {
		var obj = {};
		text.replace(/([0-9]*\%)[^\{\}]*\{([^\}\{]*)\}/g,function($1,$2,$3) { 
			if(obj.hasOwnProperty($2)) $.extend(obj[$2],getCSSObj($3) );
			else obj[$2] = getCSSObj($3);
		});
		return obj;
	}

	// Convert CSS string into an object
	function getCSSObj(text) {
		var obj = {};
		text.replace(/([a-zA-Z_-]+)[^\w:]*:\s*([^;]+)/g,function($1,$2,$3) { obj[$2] = $3; });
		return obj;
	}

	// Convert pseudo-CSS (from Animation Settings) into an object, converting snake-case property names to camelCase
	function getCamelCaseObj(text) {
		var obj = {};
		text.replace(/([\-\w]+)[^\-\w:]*:\s*([^;]+)/g,function($1,$2,$3) {
			obj[ $2.replace(/(\-[a-z])/g, function($1){return $1.toUpperCase().replace('-','');}) ] = $3;
		});
		return obj;
	}

	
	// Convert Objects into CSS strings:
	// CSS properties are added in alphabetical order, so that string comparison will identify identical objects
	
	// Convert a CSS object into a string
	function getObjCSS(obj) {
		var arr = [], text = "";
		for(var i in obj) arr.push([i,obj[i]]);
		arr.sort(function(a,b) { return a[0]-b[0]; });
		for(var i=0;i<arr.length;i++) text+= arr[i][0]+':'+arr[i][1]+';';
		return text;
	}
	
	// Convert a keyframes object to string
	function getObjKeyframes(obj) {
		var arr = [], text = "";
		for(var i in obj) arr.push([parseFloat(i),getObjCSS(obj[i])]);
		arr.sort(function(a,b) { return a[0]-b[0]; });
		for(var i=0;i<arr.length;i++) text+= arr[i][0]+'%{'+arr[i][1]+'}';
		return text;
	}
	
	

	// Create keyframes objects of any @keyframes in the CSS that can be read (depends on CORS)
	function getKeyframes() {
		var styles = document.styleSheets;
		var type = window.CSSRule.WEBKIT_KEYFRAMES_RULE || window.CSSRule.KEYFRAMES_RULE;
		var keyframes = {};
		for (var declaration in styles) {
			try {
				if (styles.hasOwnProperty(declaration)) {
					var ruleSet = styles[declaration].cssRules;
					for (var rule in ruleSet) {
						if (ruleSet.hasOwnProperty(rule)) {
							var currentRule = ruleSet[rule];
							if (currentRule.type == type) {
								currentRule.cssText.replace(/[\r\n]/g,'').replace(/^@keyframes\W+(\w+)[^\w\{]*\{(.*)\}\W*$/,function($1,$2,$3) {
								keyframes[$2] = getKeyframeObj($3);
								});
							}
						}
					}
				}
			}
			catch(e) {
			}
		}
		return keyframes;
	}

	// Check element for any data-t attributes, and return a config object
	function getAttributes(obj,settings) {
		var data = {};
		$.each(obj[0].attributes, function() {
			if(this.specified) {
				var value = this.value
				this.name.replace(/^(data-t([1-9][0-9]*)?)((-([0-9]*)(\.[0-9]+)?(\%)?)|-loop)?$/, function($1,$2,$3,$4,$5,$6,$7,$8) {
					if(!data.hasOwnProperty($2)) data[$2]= {
						key: [],
						anim: [],
						config: $.extend({},settings),
					};
					var time = parseFloat($6+$7);
					if($4 === "-loop") data[$2].config["iterationCount"] = parseInt(value) || "infinite";
					else if($1 === $2) data[$2].config = $.extend(data[$2].config,getCamelCaseObj(value));
					else if($8 === "%" && time >= 0 && time <= 100) data[$2].key.push( [time,value] );
					else if( time >= 0 ) data[$2].anim.push( [time,value] );
				});
			}
		});
		return data;
	}

	// Add a new set of animation keyframes to global store *if* it is new
	function addAnim(frames) {
		var length = global.animations.length;
		var anim = getObjKeyframes(frames);
		for(var i=0;i<length;i++) {
			if(global.animations[i] == anim) return i;
		}
		
		frames.name = 'Animatr'+length;
		$.keyframe.define([frames]);
		global.animations.push(anim);
		return length;
	}
	
	// restart animation
	function replayAnimation(obj) {
		if(obj.data('Animatr')) {
			obj.resetKeyframe(function() {
				var temp = obj[0].offsetWidth; //Trigger reflow
				obj.playKeyframe(obj.data('Animatr'));
			});
		}
	}


	// Main function:
	
	function Animatr(selector,opts) {

		var settings = {duration: '10s',delay:'0s'};
		if(opts) {
			if(typeof opts === "string") {
				switch( opts.toLowerCase() ) {
					case "pause":
						return selector.each(function() { $(this).pauseKeyframe(); });
					case "play":
						return selector.each(function() { $(this).resumeKeyframe(); });
					case "restart":
						return selector.each(function() { replayAnimation($(this)); });
					default:
						settings = $.extend(settings,getCamelCaseObj(opts));
				}
			}
		}
		return selector.each(function(){                                                                                                                            
			var obj = $(this);
			if( !obj.data('Animatr') ) {

				var data = getAttributes(obj, settings);				
				if(!$.isEmptyObject(data)) {
					for(var i in data) { 
						var length = data[i].anim.length;
						if(length) {	
							data[i].anim.sort(function(a,b) {return a[0]-b[0]});
							var max = data[i].anim[length-1][0];
							if(max>0) data[i].config["duration"] = max+'s';
							for(var j=0;j<length;j++) {
								var percent = parseInt(data[i].anim[j][0] * 10000 / max)/100;
								data[i].key.push( [percent, data[i].anim[j][1]] )
							}
						}
					}

					var instructions = [];
					for(var i in data) {
						var frames = {};
						
						data[i].key.sort(function(a,b) {return a[0]-b[0];});
						var keyLength = data[i].key.length;
						
						for(var j=0;j<data[i].key.length;j++) {
							var css = {};
							css[data[i].key[j][0]+'%'] = getCSSObj(data[i].key[j][1]);
							merge(frames,css);
						}
						
						if(data[i].config.keyframes) {
							var remaining = [];
							data[i].config.keyframes.replace(/[a-zA-Z0-9\-_]+/g,function ($1) {
								if(global.keyframes.hasOwnProperty($1)) merge(frames,global.keyframes[$1]);
								else remaining.push($1);
							});
							
							if(remaining.length) {
								for(var n=0;n<remaining.length;n++) {
									var copyConfig = $.extend(true,{},data[i].config);
									copyConfig["name"] = remaining[n];
									instructions.push(copyConfig);
								}
							}
						}
						data[i].config.name = "Animatr" + addAnim(frames);
						instructions.push(data[i].config);
					}
		
					if(instructions.length) obj.playKeyframe(instructions).data('Animatr',instructions);
				}
			}
		});
	}
	
})( jQuery, window, document );