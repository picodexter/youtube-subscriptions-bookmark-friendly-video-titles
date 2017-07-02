// ==UserScript==
// @name        YouTube Subscriptions Bookmark-Friendly Video Titles
// @namespace   https://github.com/picodexter/youtube-subscriptions-bookmark-friendly-video-titles
// @description Prepends the channel name and the video duration to the video titles in YouTube's subscription feed.
// @version     1.0.0
// @author      picodexter (https://picodexter.io/)
// @copyright   2017+, picodexter (https://picodexter.io/)
// @license     GPL version 3 or any later version; http://www.gnu.org/copyleft/gpl.html
// @grant       none
// @homepageURL https://github.com/picodexter/youtube-subscriptions-bookmark-friendly-video-titles
// @match       https://www.youtube.com/feed/subscriptions
// @supportURL  https://github.com/picodexter/youtube-subscriptions-bookmark-friendly-video-titles/issues
// ==/UserScript==

VideoTitleRewriter = new function () {
    var debug = false;

    /**
     * Run rewriter.
     */
    this.run = function () {
        var feedContainer = getFeedContainer();

        if (!feedContainer) {
            return;
        }

        debugMessage('Feed container: ', feedContainer);

        var a = feedContainer.querySelectorAll('ytd-item-section-renderer');
        var currentFeedItemElement, i;
        var youtubeUser, videoDuration, videoTitle;
        var sep;

        for (i = 0; i < a.length; i++) {
            currentFeedItemElement = a[i];

            if (currentFeedItemElement.dataset.ytsbtpProcessed === '1') {
                continue;
            }

            debugMessage('Found unprocessed list entry.');

            /*
             * Video duration
             */
            videoDuration = '';
            var videoDurationElement = currentFeedItemElement.querySelector('ytd-thumbnail-overlay-time-status-renderer .ytd-thumbnail-overlay-time-status-renderer');
            if (!videoDurationElement) {
                continue;
            }
            videoDuration = videoDurationElement.innerHTML.trim();
            if (videoDuration.indexOf('<') > -1) {
                videoDuration = videoDuration.substr(0, videoDuration.indexOf('<'));
            }

            debugMessage('Video duration: ' + videoDuration);

            /*
             * YouTube user
             */
            var youtubeUserElement = currentFeedItemElement.querySelector('ytd-video-meta-block .ytd-video-meta-block #byline > a');
            if (!youtubeUserElement) {
                continue;
            }
            youtubeUser = youtubeUserElement.innerHTML;

            debugMessage('YouTube user: ' + youtubeUser);

            /*
             * Video title
             */
            var videoTitleElement = currentFeedItemElement.querySelector('#meta h3 #video-title');
            if (!videoTitleElement) {
                continue;
            }
            videoTitle = videoTitleElement.innerHTML.trim();

            debugMessage('Video title: ' + videoTitle);

            sep = (videoDuration === '' ? ' | ' : ' [' + formatDuration(videoDuration) + '] ');

            var newTitle = youtubeUser + sep + videoTitle;
            newTitle = newTitle.trim();

            videoTitleElement.innerHTML = newTitle;
            currentFeedItemElement.dataset.ytsbtpProcessed = '1';

            debugMessage('List entry successfully processed.');
        }
    };

    /**
     * Register observer.
     *
     * Observes DOM changes in case content gets added via AJAX ("load more"). Triggers run().
     */
    this.registerObserver = function () {
        var feedContainer = getFeedContainer();

        if (!feedContainer) {
            debugMessage('No feed container found for binding MutationObserver event.');
            return;
        }

        //noinspection JSUnresolvedFunction,JSUnusedLocalSymbols
        var observer = new MutationObserver(function(mutations) {
            VideoTitleRewriter.run();
        });

        //noinspection JSCheckFunctionSignatures
        observer.observe(feedContainer, { childList: true });

        debugMessage('Mutation observer bound to feed container.');
    };

    /**
     * Get the feed container.
     *
     * @returns {Element}
     */
    var getFeedContainer = function () {
        var feedContainer = document.querySelector('.ytd-browse > #primary > #contents');

        if (!feedContainer) {
            debugMessage('Could not find feed container.');
        }

        return (feedContainer ? feedContainer : false);
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
    }
};

VideoTitleRewriter.registerObserver();
VideoTitleRewriter.run();
