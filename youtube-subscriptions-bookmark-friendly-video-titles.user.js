// ==UserScript==
// @name        YouTube Subscriptions Bookmark-Friendly Video Titles
// @namespace   https://github.com/picodexter/youtube-subscriptions-bookmark-friendly-video-titles
// @description Prepends the channel name and the video duration to the video titles in YouTube's subscription feed.
// @version     1.0.2
// @author      picodexter (https://picodexter.io/)
// @copyright   2017+, picodexter (https://picodexter.io/)
// @license     GPL-3.0+; http://www.gnu.org/copyleft/gpl.html
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
                    debugMessage('SKIP: Could not get video duration.', currentFeedItemElement);
                    continue;
                }
                var videoDuration = videoDurationElement.innerHTML.trim();
                if (videoDuration.indexOf('<') > -1) {
                    videoDuration = videoDuration.substr(0, videoDuration.indexOf('<'));
                }

                debugMessage('Video duration: ' + videoDuration, currentFeedItemElement);

                /*
                 * Channel name
                 */
                var channelNameElement = getChannelNameElement(currentFeedItemElement);
                if (!channelNameElement) {
                    debugMessage('SKIP: Could not get channel name.', currentFeedItemElement);
                    continue;
                }
                var channelName = channelNameElement.innerHTML;

                debugMessage('Channel name: ' + channelName, currentFeedItemElement);

                /*
                 * Video title
                 */
                var videoTitleElement = getVideoTitleElement(currentFeedItemElement);
                if (!videoTitleElement) {
                    debugMessage('SKIP: Could not get video title.', currentFeedItemElement);
                    continue;
                }
                var videoTitle = videoTitleElement.innerHTML.trim();

                debugMessage('Video title: ' + videoTitle, currentFeedItemElement);

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
                console.info(arguments);
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
         * Get element containing the channel info.
         *
         * @param {Element} feedItemElement
         *
         * @returns {Element}
         */
        var getChannelNameElement = function (feedItemElement) {
            if (isUsingWebComponents()) {
                return feedItemElement.querySelector('#metadata #byline-container #byline > a');
            } else {
                return feedItemElement.querySelector('.yt-lockup-byline > a');
            }
        };

        /**
         * Get the feed container element.
         *
         * @returns {Element}
         */
        var getFeedContainerElement = function () {
            if (isUsingWebComponents()) {
                return document.querySelector('.ytd-browse > #primary > #contents');
            } else {
                return document.querySelector('#browse-items-primary');
            }
        };

        /**
         * Get feed item elements.
         *
         * @param {Element} feedContainer
         *
         * @returns {NodeList}
         */
        var getFeedItemElements = function (feedContainer) {
            if (isUsingWebComponents()) {
                if (isGridView()) {
                    return feedContainer.querySelectorAll('#items > .ytd-grid-renderer');
                } else {
                    return feedContainer.querySelectorAll('#contents.ytd-item-section-renderer');
                }
            } else {
                if (isGridView()) {
                    return feedContainer.querySelectorAll('.shelf-content .yt-shelf-grid-item');
                } else {
                    return feedContainer.querySelectorAll('.feed-item-container .feed-item-dismissable');
                }
            }
        };

        /**
         * Get element containing the video duration.
         *
         * @param {Element} feedItemElement
         *
         * @returns {Element}
         */
        var getVideoDurationElement = function (feedItemElement) {
            if (isUsingWebComponents()) {
                return feedItemElement.querySelector('#thumbnail #overlays .ytd-thumbnail-overlay-time-status-renderer');
            } else {
                return feedItemElement.querySelector('.yt-thumb .video-time');
            }
        };

        /**
         * Get element containing the video title.
         *
         * @param {Element} feedItemElement
         *
         * @returns {Element}
         */
        var getVideoTitleElement = function (feedItemElement) {
            if (isUsingWebComponents()) {
                return feedItemElement.querySelector('#meta h3 #video-title');
            } else {
                return feedItemElement.querySelector('.yt-lockup-title > a');
            }
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
