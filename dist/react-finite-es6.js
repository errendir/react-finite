import { Children, PureComponent, createElement } from 'react';

/*! *****************************************************************************
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the Apache License, Version 2.0 (the "License"); you may not use
this file except in compliance with the License. You may obtain a copy of the
License at http://www.apache.org/licenses/LICENSE-2.0

THIS CODE IS PROVIDED ON AN *AS IS* BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
KIND, EITHER EXPRESS OR IMPLIED, INCLUDING WITHOUT LIMITATION ANY IMPLIED
WARRANTIES OR CONDITIONS OF TITLE, FITNESS FOR A PARTICULAR PURPOSE,
MERCHANTABLITY OR NON-INFRINGEMENT.

See the Apache Version 2.0 License for specific language governing permissions
and limitations under the License.
***************************************************************************** */
/* global Reflect, Promise */

var extendStatics = Object.setPrototypeOf ||
    ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
    function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };

function __extends(d, b) {
    extendStatics(d, b);
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
}

var __assign = Object.assign || function __assign(t) {
    for (var s, i = 1, n = arguments.length; i < n; i++) {
        s = arguments[i];
        for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
    }
    return t;
};

var defaultInitialNumberOfDisplayedChildren = 50;
var defaultSafetyMarginInPixels = 600;
var defaultChildrenBlockSize = 19;
var ReactFinite = /** @class */ (function (_super) {
    __extends(ReactFinite, _super);
    function ReactFinite(props) {
        var _this = _super.call(this, props) || this;
        _this.heightsOfInvisibleFrontBlocks = [];
        _this.heightsOfInvisibleBackBlocks = []; // TODO: Initialize to some sensible value or let the user pass it
        _this.container = null;
        _this.scrollContent = null;
        _this.blocksByBlockId = {};
        _this.frontBumper = null;
        _this.backBumper = null;
        _this.getBumperStyle = function () {
            var safetyMarginInPixels = _this.props.safetyMarginInPixels || defaultSafetyMarginInPixels;
            return {
                height: safetyMarginInPixels,
                width: "100%",
                position: "absolute",
                // It's important bumpers don't have z-index - I believe this is what messes the scrollTop behaviour
                backgroundColor: _this.props.debug ? "hsla(270, 50%, 40%, 0.3)" : undefined
            };
        };
        _this.isFrontBumperVisible = true;
        _this.isBackBumperVisible = true;
        _this.frontBumperVisibilityChanged = function (entries) {
            for (var _i = 0, entries_1 = entries; _i < entries_1.length; _i++) {
                var entry = entries_1[_i];
                if (entry.intersectionRatio >= 0 && entry.isIntersecting === true) {
                    _this.isFrontBumperVisible = true;
                }
                else if (entry.intersectionRatio === 0 && entry.isIntersecting === false) {
                    _this.isFrontBumperVisible = false;
                }
                if (entry.intersectionRatio >= 0.4 && entry.isIntersecting === true) {
                    _this.scheduleEndpointExpansion(Endpoint.Front);
                }
            }
        };
        _this.backBumperVisibilityChanged = function (entries) {
            for (var _i = 0, entries_2 = entries; _i < entries_2.length; _i++) {
                var entry = entries_2[_i];
                if (entry.intersectionRatio >= 0 && entry.isIntersecting === true) {
                    _this.isBackBumperVisible = true;
                }
                else if (entry.intersectionRatio === 0 && entry.isIntersecting === false) {
                    _this.isBackBumperVisible = false;
                }
                if (entry.intersectionRatio >= 0.4 && entry.isIntersecting === true) {
                    _this.scheduleEndpointExpansion(Endpoint.Back);
                }
            }
        };
        _this.state = {
            childrenBlocksStartIndex: 0,
            childrenBlocksEndIndex: Math.max(Math.ceil((props.initialNumberOfDisplayedChildren || defaultInitialNumberOfDisplayedChildren) /
                (props.childrenBlockSize || defaultChildrenBlockSize)), 1)
        };
        return _this;
    }
    ReactFinite.prototype.componentDidMount = function () {
        if (this.frontBumper === null)
            throw new Error("Front Bumper is not rendered");
        if (this.backBumper === null)
            throw new Error("Back Bumper is not rendered");
        if (this.container === null)
            throw new Error("Container is not rendered");
        this.frontObserver = new IntersectionObserver(this.frontBumperVisibilityChanged, {
            root: this.props.useWindowForVisibilityDetection ? undefined : this.container,
            threshold: [0, 0.2, 0.4, 0.6, 0.8, 1.0]
        });
        this.frontObserver.observe(this.frontBumper);
        this.backObserver = new IntersectionObserver(this.backBumperVisibilityChanged, {
            root: this.props.useWindowForVisibilityDetection ? undefined : this.container,
            threshold: [0, 0.2, 0.4, 0.6, 0.8, 1.0]
        });
        this.backObserver.observe(this.backBumper);
    };
    ReactFinite.prototype.componentWillUpdate = function (_nextProps, nextState) {
        // TODO: Deduplicate this code
        for (var blockId = this.state.childrenBlocksStartIndex; blockId < nextState.childrenBlocksStartIndex; ++blockId) {
            var block = this.blocksByBlockId[blockId];
            if (block !== undefined && block !== null) {
                var height = block.offsetHeight;
                this.heightsOfInvisibleFrontBlocks.push(height);
            }
        }
        for (var blockId = nextState.childrenBlocksStartIndex; blockId < this.state.childrenBlocksStartIndex; ++blockId) {
            var height = this.heightsOfInvisibleFrontBlocks.pop();
            if (height === undefined) {
                throw new Error("The previous block height must be known");
            }
        }
        for (var blockId = nextState.childrenBlocksEndIndex; blockId < this.state.childrenBlocksEndIndex; ++blockId) {
            var block = this.blocksByBlockId[blockId];
            if (block !== undefined && block !== null) {
                var height = block.offsetHeight;
                this.heightsOfInvisibleBackBlocks.push(height);
            }
        }
        for (var blockId = this.state.childrenBlocksEndIndex; blockId < nextState.childrenBlocksEndIndex; ++blockId) {
            this.heightsOfInvisibleBackBlocks.pop();
        }
    };
    ReactFinite.prototype.componentWillUnmount = function () {
        this.backObserver.disconnect();
        this.frontObserver.disconnect();
    };
    ReactFinite.prototype.getChildrenBlocks = function () {
        var _a = this.props, ElementComponent = _a.ElementComponent, elements = _a.elements;
        var getChildrenSlice;
        var numberOfChildren;
        if (ElementComponent && elements) {
            getChildrenSlice = function (start, end) { return elements.slice(start, end).map(function (element) { return createElement(ElementComponent, __assign({}, element)); }); };
            numberOfChildren = elements.length;
        }
        else {
            var allChildren_1 = Children.toArray(this.props.children);
            getChildrenSlice = function (start, end) { return allChildren_1.slice(start, end); };
            numberOfChildren = allChildren_1.length;
        }
        var childrenBlockSize = this.props.childrenBlockSize || defaultChildrenBlockSize;
        var maxBlockId = Math.floor(numberOfChildren / childrenBlockSize);
        var blocks = [];
        var _b = this.state, childrenBlocksStartIndex = _b.childrenBlocksStartIndex, childrenBlocksEndIndex = _b.childrenBlocksEndIndex;
        for (var blockId = Math.max(childrenBlocksStartIndex, 0); blockId < Math.min(childrenBlocksEndIndex, maxBlockId + 1); ++blockId) {
            blocks.push({ blockId: blockId, children: getChildrenSlice(childrenBlockSize * blockId, childrenBlockSize * (blockId + 1)) });
        }
        return blocks;
    };
    ReactFinite.prototype.render = function () {
        var _this = this;
        var blocks = this.getChildrenBlocks();
        return createElement("div", { ref: function (container) { return _this.container = container; }, style: this.props.style, className: this.props.className },
            createElement("div", { ref: function (scrollContent) { return _this.scrollContent = scrollContent; } },
                this.renderFrontPadding(),
                createElement("div", { style: { position: "relative" } },
                    blocks.map(function (block) {
                        return createElement("div", { key: block.blockId, ref: function (blockElement) { return _this.blocksByBlockId[block.blockId] = blockElement; } }, block.children);
                    }),
                    this.renderBackBumper(),
                    this.renderFrontBumper()),
                this.renderBackPadding()));
    };
    ReactFinite.prototype.renderFrontPadding = function () {
        return createElement("div", null, this.heightsOfInvisibleFrontBlocks.map(function (height, id) { return createElement("div", { key: id, style: { height: height } }); }));
    };
    ReactFinite.prototype.renderBackPadding = function () {
        var childrenBlockSize = this.props.childrenBlockSize || defaultChildrenBlockSize;
        var numberOfChildren = this.getNumberOfChildren();
        //const lastBlockPadding = childrenBlockSize - (numberOfChildren % childrenBlockSize)
        var noRemainingElements = Math.max(0, numberOfChildren - this.state.childrenBlocksEndIndex * childrenBlockSize);
        var estimatedElementHeightInPixels = (this.heightsOfInvisibleBackBlocks.length > 0 || this.heightsOfInvisibleFrontBlocks.length > 0)
            ? (this.heightsOfInvisibleBackBlocks.reduce(function (a, b) { return a + b; }, 0) + this.heightsOfInvisibleFrontBlocks.reduce(function (a, b) { return a + b; }, 0))
                / (this.heightsOfInvisibleBackBlocks.length + this.heightsOfInvisibleFrontBlocks.length)
                / childrenBlockSize
            : (this.props.estimatedElementHeightInPixels || 0);
        return createElement("div", null,
            this.heightsOfInvisibleBackBlocks.map(function (height, id) { return createElement("div", { key: id, style: { height: height } }); }),
            createElement("div", { style: { height: noRemainingElements * estimatedElementHeightInPixels } }));
    };
    // TODO: this number doesn't need to be computed multiple times during one rendering
    ReactFinite.prototype.getNumberOfChildren = function () {
        var _a = this.props, ElementComponent = _a.ElementComponent, elements = _a.elements;
        if (ElementComponent && elements) {
            return elements.length;
        }
        else {
            return Children.count(this.props.children);
        }
    };
    ReactFinite.prototype.renderFrontBumper = function () {
        var _this = this;
        var style = __assign({ top: "0px" }, this.getBumperStyle());
        return createElement("div", { ref: function (frontBumper) { return _this.frontBumper = frontBumper; }, style: style });
    };
    ReactFinite.prototype.renderBackBumper = function () {
        var _this = this;
        var style = __assign({ bottom: "0px" }, this.getBumperStyle());
        return createElement("div", { ref: function (backBumper) { return _this.backBumper = backBumper; }, style: style });
    };
    ReactFinite.prototype.scheduleEndpointExpansion = function (endpoint) {
        var _this = this;
        if (endpoint === Endpoint.Front) {
            this.setState(function (state) { return state.childrenBlocksStartIndex !== 0 ? {
                "childrenBlocksStartIndex": state.childrenBlocksStartIndex - 1,
                "childrenBlocksEndIndex": _this.isBackBumperVisible ? state.childrenBlocksEndIndex : state.childrenBlocksEndIndex - 1
            } : null; });
        }
        else {
            this.setState(function (state) { return ({
                "childrenBlocksEndIndex": state.childrenBlocksEndIndex + 1,
                "childrenBlocksStartIndex": _this.isFrontBumperVisible ? state.childrenBlocksStartIndex : state.childrenBlocksStartIndex + 1
            }); });
        }
    };
    return ReactFinite;
}(PureComponent));
var Endpoint;
(function (Endpoint) {
    Endpoint[Endpoint["Front"] = 0] = "Front";
    Endpoint[Endpoint["Back"] = 1] = "Back";
})(Endpoint || (Endpoint = {}));

export { ReactFinite };
export default ReactFinite;
