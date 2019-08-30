// ==UserScript==
// @name        YouTube Subscriptions Bookmark-Friendly Video Titles
// @namespace   https://github.com/picodexter/youtube-subscriptions-bookmark-friendly-video-titles
// @description Prepends the channel name and the video duration to the video titles in YouTube's subscription feed.
// @version     1.0.3
// @author      picodexter (https://picodexter.io/)
// @copyright   2017+, picodexter (https://picodexter.io/)
// @license     GPL-3.0-or-later; https://www.gnu.org/licenses/gpl-3.0-standalone.html
// @grant       none
// @homepageURL https://github.com/picodexter/youtube-subscriptions-bookmark-friendly-video-titles
// @match       https://www.youtube.com/feed/subscriptions
// @match       https://www.youtube.com/feed/subscriptions?*
// @supportURL  https://github.com/picodexter/youtube-subscriptions-bookmark-friendly-video-titles/issues
// ==/UserScript==

(function() {
    'use strict';

    var VideoTitleRewriter = function () {
        var debug = false;

        var usingGridView = null;
        var usingWebComponents = null;

        var selectors = {
            'channelNameElement': {
                'webComponents0': '.yt-lockup-byline > a',
                'webComponents1': '#metadata #byline-container #channel-name #text.ytd-channel-name > a',
            },
            'feedContainerElement': {
                'webComponents0': '#browse-items-primary',
                'webComponents1': '.ytd-browse > #primary > ytd-section-list-renderer > #contents',
            },
            'feedItemElements': {
                'webComponents0_gridView0': '.feed-item-container .feed-item-dismissable',
                'webComponents0_gridView1': '.shelf-content .yt-shelf-grid-item',
                'webComponents1_gridView0': '#contents.ytd-item-section-renderer',
                'webComponents1_gridView1': '#items > .ytd-grid-renderer',
            },
            'videoDurationElement': {
                'webComponents0': '.yt-thumb .video-time',
                'webComponents1': '#thumbnail #overlays .ytd-thumbnail-overlay-time-status-renderer',
            },
            'videoTitleElement': {
                'webComponents0': '.yt-lockup-title > a',
                'webComponents1': '#meta h3 #video-title',
            },
        };

        /**
         * Run rewriter.
         */
        this.run = function () {
            debugMessage('Running video title rewriter.');

            debugMessage('STATUS: Using Web Components:', isUsingWebComponents());

            debugMessage('STATUS: Grid view detected:', isGridView());

            var feedContainer = getFeedContainerElement();

            if (!feedContainer) {
                return;
            }

            debugMessage('Feed container: ', feedContainer);

            var feedItemElements = getFeedItemElements(feedContainer);

            for (var i = 0; i < feedItemElements.length; i++) {
                var currentFeedItemElement = feedItemElements[i];

                if ('1' === currentFeedItemElement.dataset.ytsbtpProcessed) {
                    continue;
                }

                debugMessage('Found unprocessed list entry.', currentFeedItemElement);

                /*
                 * Video duration
                 */
                var videoDurationElement = getVideoDurationElement(currentFeedItemElement);
                if (!videoDurationElement) {
                    debugMessage('SKIP: Could not get video duration.');
                    continue;
                }
                var videoDuration = videoDurationElement.innerHTML.trim();
                if (videoDuration.indexOf('<') > -1) {
                    videoDuration = videoDuration.substr(0, videoDuration.indexOf('<'));
                }

                debugMessage('Video duration: ' + videoDuration);

                /*
                 * Channel name
                 */
                var channelNameElement = getChannelNameElement(currentFeedItemElement);
                if (!channelNameElement) {
                    debugMessage('SKIP: Could not get channel name.');
                    continue;
                }
                var channelName = channelNameElement.innerHTML;

                debugMessage('Channel name: ' + channelName);

                /*
                 * Video title
                 */
                var videoTitleElement = getVideoTitleElement(currentFeedItemElement);
                if (!videoTitleElement) {
                    debugMessage('SKIP: Could not get video title.');
                    continue;
                }
                var videoTitle = videoTitleElement.innerHTML.trim();

                debugMessage('Video title: ' + videoTitle);

                var separator = (videoDuration === '' ? ' | ' : ' [' + formatDuration(videoDuration) + '] ');

                var newTitle = channelName + separator + videoTitle;
                newTitle = newTitle.trim();

                videoTitleElement.innerHTML = newTitle;
                currentFeedItemElement.dataset.ytsbtpProcessed = '1';

                debugMessage('List entry successfully processed.');
            }

            debugMessage('End of running video title rewriter.');
        };

        /**
         * Register observer.
         *
         * Observes DOM changes in case content gets added via AJAX ("load more"). Triggers run().
         */
        this.registerObserver = function () {
            var feedContainer = getFeedContainerElement();

            if (!feedContainer) {
                debugMessage('No feed container found for binding MutationObserver event.');
                return;
            }

            //noinspection JSUnresolvedFunction,JSUnusedLocalSymbols
            var observer = new MutationObserver(function(mutations) {
                rewriter.run();
            });

            //noinspection JSCheckFunctionSignatures
            observer.observe(
                feedContainer,
                {
                    childList: true,
                    attributes: true,
                    characterData: true,
                    subtree: true
                }
            );

            debugMessage('Mutation observer bound to feed container.');
        };

        /**
         * Output debug message.
         *
         * Only works if debug mode is enabled.
         *
         * @param {...*} arguments
         */
        var debugMessage = function () {
            if (debug) {
                console.info(...arguments);
            }
        };

        /**
         * Format duration.
         *
         * Prepends leading zeroes to single-digit units.
         *
         * @param {string} duration
         *
         * @returns {string}
         */
        var formatDuration = function (duration) {
            var t = duration.split(/:/);
            var r = [];

            for (var i = 0; i < t.length; i++) {
                r.push(t[i].length < 2 ? '0' + t[i] : t[i]);
            }

            return r.join(':');
        };

        /**
         * Get element containing the channel name.
         *
         * @param {Element} feedItemElement
         *
         * @returns {Element}
         */
        var getChannelNameElement = function (feedItemElement) {
            return getElementByName('channelNameElement', feedItemElement);
        };

        /**
         * Get element by name.
         *
         * @param {string}     elementName
         * @param {ParentNode} parentNode
         *
         * @returns {Element}
         */
        var getElementByName = function (elementName, parentNode) {
            return parentNode.querySelector(getElementSelector(elementName));
        };

        /**
         * Get elements by name.
         *
         * @param {string}     elementName
         * @param {ParentNode} parentNode
         *
         * @returns {NodeList}
         */
        var getElementsByName = function (elementName, parentNode) {
            return parentNode.querySelectorAll(getElementSelector(elementName));
        };

        /**
         * Get element selector.
         *
         * @param {string} elementName
         *
         * @returns {string}
         */
        var getElementSelector = function (elementName) {
            var modeKeyWebComponents = 'webComponents' + (isUsingWebComponents() ? '1' : '0');
            var modeKeyFull = modeKeyWebComponents + '_gridView' + (isGridView() ? '1' : '0');
            var selector = null;

            if (typeof selectors[elementName] !== 'undefined') {
                var modeKey = (typeof selectors[elementName][modeKeyFull] !== 'undefined'
                    ? modeKeyFull
                    : modeKeyWebComponents);
                selector = (typeof selectors[elementName][modeKey] !== 'undefined'
                    ? selectors[elementName][modeKey]
                    : null);
            }

            debugMessage('Selector for element name ' + elementName + ':', selector);

            return selector;
        };

        /**
         * Get the feed container element.
         *
         * @returns {Element}
         */
        var getFeedContainerElement = function () {
            return getElementByName('feedContainerElement', document);
        };

        /**
         * Get feed item elements.
         *
         * @param {Element} feedContainer
         *
         * @returns {NodeList}
         */
        var getFeedItemElements = function (feedContainer) {
            return getElementsByName('feedItemElements', feedContainer);
        };

        /**
         * Get element containing the video duration.
         *
         * @param {Element} feedItemElement
         *
         * @returns {Element}
         */
        var getVideoDurationElement = function (feedItemElement) {
            return getElementByName('videoDurationElement', feedItemElement);
        };

        /**
         * Get element containing the video title.
         *
         * @param {Element} feedItemElement
         *
         * @returns {Element}
         */
        var getVideoTitleElement = function (feedItemElement) {
            return getElementByName('videoTitleElement', feedItemElement);
        };

        /**
         * Check if website is using grid view.
         *
         * @returns {boolean}
         */
        var isGridView = function () {
            if (null === usingGridView) {
                if (isUsingWebComponents()) {
                    usingGridView = (null !== document.querySelector('#items.ytd-grid-renderer'));
                } else {
                    usingGridView = (null !== document.querySelector('.yt-shelf-grid-item'));
                }
            }

            return usingGridView;
        };

        /**
         * Check if website is using Web Components.
         *
         * @returns {boolean}
         */
        var isUsingWebComponents = function () {
            if (null === usingWebComponents) {
                usingWebComponents = (null !== document.querySelector('template'));
            }

            return usingWebComponents;
        };
    };

    var rewriter = new VideoTitleRewriter();

    rewriter.registerObserver();
    rewriter.run();
})();
