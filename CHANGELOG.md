# Changelog

This project adheres to [Semantic Versioning](http://semver.org/).

## (Unreleased)

### Added

*   (empty)

### Changed

*   (empty)

### Deprecated

*   (empty)

### Removed

*   (empty)

### Fixed

*   (empty)

### Security

*   (empty)

## 1.0.7 (2020-01-08)

### Fixed

*   Fixed whitespace appearing at beginning of bookmark title when dragging and dropping in Firefox.

## 1.0.6 (2020-01-08)

### Fixed

*   Fixed detection of video title.

## 1.0.5 (2019-11-07)

### Fixed

*   Fixed and improved rewrite trigger.
*   Fixed video duration element path for Web Components = true.

## 1.0.4 (2019-08-31)

### Changed

*   Formatted code according to coding standards.
*   Improved internal element selector management.
*   Improved performance considerably by triggering rewrites through MutationObserver only when the video duration
    element was updated and only once per observation call.

### Fixed

*   Fixed channel name detection for Web Components = true, grid view = false.
*   Improved debug message logging.

## 1.0.3 (2019-08-16)

### Fixed

*   Fixed container path for Web Components = true, grid view = false.
*   Fixed and updated license information.

## 1.0.2 (2017-11-06)

### Fixed

*   Fix license name in @license tag to use SPDX code. This is required to retain support with OpenUserJS.

## 1.0.1 (2017-10-19)

### Added

*   More debug messages.

### Fixed

*   Fix video duration extraction that stopped working due to now delayed rendering on YouTube's side.

## 1.0.0 (2017-07-03)

*   Initial release
