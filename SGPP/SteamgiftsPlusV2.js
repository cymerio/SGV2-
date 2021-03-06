var ModuleDefinition;
(function (ModuleDefinition) {
    var LocalStorage = (function () {
        function LocalStorage() {
            var _this = this;
            this._LSPrefix = "SGPP_";
            this.containsItem = function (key) {
                return localStorage.getItem(_this._LSPrefix + key) != null;
            };
            this.getItem = function (key) {
                return localStorage.getItem(_this._LSPrefix + key);
            };
            this.setItem = function (key, value) {
                localStorage.setItem(_this._LSPrefix + key, value);
            };
        }
        return LocalStorage;
    })();
    ModuleDefinition.LocalStorage = LocalStorage;
})(ModuleDefinition || (ModuleDefinition = {}));
var ModuleDefinition;
(function (ModuleDefinition) {
    var Core = (function () {
        function Core() {
            var _this = this;
            this._debug = true;
            this._settings = new ModuleDefinition.Settings();
            this._storage = new ModuleDefinition.LocalStorage();
            this.modules = {};
            this.log = function (msg) {
                if (_this._debug)
                    console.log("[" + new Date() + "] SGPP - " + msg);
            };
            this.appendCSS = function (css) {
                $('style').append(css);
            };
            this.style = "";
            this.init = function () {
                _this.log("Steamgifts++ plugin started.");
                _this.resolvePath();
                $('head').append($('<style>'));
                _this.appendCSS('/* SGPP Stylesheet */ ');
                _this.appendCSS(_this._settings.style);
                _this._settings.init();
            };
            this.resolvePath = function () {
                var hash = "";
                var pageKind = "";
                var code = "";
                var description = "";
                var subpage = "";
                var windowLocation = window.location;
                if (windowLocation.hash.length > 1)
                    hash = windowLocation.hash.substring(1);
                if (windowLocation.pathname == '/') {
                    pageKind = "giveaways";
                }
                else {
                    var split = windowLocation.pathname.split("/").filter(function (a, b, c) {
                        return Boolean(a);
                    });
                    pageKind = split[0] || '';
                    description = split[2] || '';
                    if (split[0] == 'giveaway' || split[0] == 'trade' || split[0] == 'discussion' || split[0] == 'user') {
                        subpage = (split[3] == 'search' ? '' : split[3]) || '';
                        code = split[1] || '';
                    }
                    else {
                        subpage = split[1] || '';
                    }
                }
                var match, pl = /\+/g, search = /([^&=]+)=?([^&]*)/g, decode = function (s) {
                    return decodeURIComponent(s.replace(pl, " "));
                }, query = windowLocation.search.substring(1);
                var urlParams = {};
                while (match = search.exec(query)) {
                    urlParams[decode(match[1])] = decode(match[2]);
                }
                _this._sgLocation = {
                    pageKind: pageKind,
                    code: code,
                    description: description,
                    subpage: subpage,
                    hash: hash,
                    parameters: urlParams
                };
            };
            this.init();
        }
        Object.defineProperty(Core.prototype, "settings", {
            get: function () {
                return this._settings;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Core.prototype, "location", {
            get: function () {
                return this._sgLocation;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Core.prototype, "storage", {
            get: function () {
                return this._storage;
            },
            enumerable: true,
            configurable: true
        });
        Core.prototype.name = function () {
            return "Core";
        };
        Core.prototype.shouldRun = function (location) {
            return true;
        };
        Core.prototype.render = function () {
            this._settings.render();
        };
        return Core;
    })();
    ModuleDefinition.Core = Core;
})(ModuleDefinition || (ModuleDefinition = {}));
var ModuleDefinition;
(function (ModuleDefinition) {
    var CommentAndEnter = (function () {
        function CommentAndEnter() {
            this.shouldRun = function (location) { return location.pageKind == 'giveaway' && location.subpage == ''; };
            this.style = ".comment_submit{margin-bottom:0!important}";
            this.init = function () {
            };
            this.render = function () {
                var submit = $('.js__submit-form');
                submit.before('<div class="sidebar__entry-insert comment_submit is-hidden">Comment and Enter</div>');
                submit.before('<div class="sidebar__entry-loading is-disabled is-hidden comment_submit"><i class="fa fa-refresh fa-spin"></i> Please wait...</div>');
                var insert = $('.sidebar .sidebar__entry-insert');
                var remove = $('.sidebar .sidebar__entry-delete');
                var button = $('.comment_submit.sidebar__entry-insert');
                var loading = $('.comment_submit.sidebar__entry-loading');
                if (!insert.hasClass('is-hidden'))
                    button.removeClass('is-hidden');
                insert.on('click', function () {
                    button.addClass('is-hidden');
                    loading.removeClass('is-hidden');
                });
                remove.on('click', function () {
                    loading.addClass('is-hidden');
                    button.removeClass('is-hidden');
                });
                button.on('click', function () {
                    insert.click();
                    button.addClass('is-hidden');
                    loading.removeClass('is-hidden');
                    var observer = new MutationObserver(function (mutations) {
                        mutations.forEach(function (mutation) {
                            if (!$(mutation.target).hasClass('is-hidden')) {
                                submit.closest("input[name=do]").val("comment_new");
                                submit.closest("form").submit();
                            }
                        });
                    });
                    observer.observe(remove[0], { attributes: true, attributeFilter: ['class'] });
                });
            };
        }
        CommentAndEnter.prototype.name = function () {
            return "CommentAndEnter";
        };
        return CommentAndEnter;
    })();
    ModuleDefinition.CommentAndEnter = CommentAndEnter;
})(ModuleDefinition || (ModuleDefinition = {}));
var ModuleDefinition;
(function (ModuleDefinition) {
    var EntryCommenters = (function () {
        function EntryCommenters() {
            var _this = this;
            this.url = 'http://www.steamgifts.com/giveaway/';
            this.cacheCompleted = false;
            this.isLoading = false;
            this.commenters = {};
            this.pageStart = 1337;
            this.elements = {
                button: $(document.createElement('i')).addClass('giveaway__icon fa fa-comments-o').attr('title', 'Check who commented'),
                loader: $(document.createElement('i')).addClass('giveaway__icon fa fa-refresh fa-spin').attr('title', 'loading comments').css('cursor', 'auto'),
                pos: $(document.createElement('span')).addClass('GAComm_pos fa-stack').attr('title', 'Commented').append($(document.createElement('i')).addClass('fa fa-comment-o fa-stack-1x')).append($(document.createElement('i')).addClass('fa fa-check fa-stack-1x')),
                neg: $(document.createElement('span')).addClass('GAComm_neg fa-stack').attr('title', 'Did not comment').append($(document.createElement('i')).addClass('fa fa-comment-o fa-stack-1x')).append($(document.createElement('i')).addClass('fa fa-times fa-stack-1x'))
            };
            this.style = ".GAComm_pos, .GAComm_neg {margin-left:-3px; vertical-align: inherit}\n" + ".GAComm_pos > i.fa.fa-check {color: #719A47}\n" + ".GAComm_neg > i.fa.fa-times {color: rgba(166, 93, 92, 0.85)}\n" + ".GAComm_pos > i.fa.fa-check, .GAComm_neg > i.fa.fa-times {font-size: 0.7em}";
            this.render = function () {
                _this.elements.button.click(_this.main);
                $('.page__heading__breadcrumbs').append(_this.elements.button);
                $('.page__heading__breadcrumbs').append(_this.elements.loader.hide());
            };
            this.main = function () {
                if (!_this.cacheCompleted) {
                    if (!_this.isLoading) {
                        _this.elements.button.hide();
                        _this.elements.loader.show();
                        _this.isLoading = true;
                        _this.getCommenters();
                    }
                    setTimeout(_this.main, 1000);
                    return;
                }
                _this.elements.loader.hide();
                _this.elements.button.show();
                $('.table__rows .table__column--width-fill').each(function (i, el) {
                    $('.GAComm_pos, .GAComm_neg', el).remove();
                    var wrapper = $('p.table__column__heading', el);
                    if (wrapper.length > 0)
                        el = wrapper[0];
                    if (_this.commenters[el.textContent.trim()]) {
                        _this.elements.pos.clone().appendTo(el);
                    }
                    else {
                        _this.elements.neg.clone().appendTo(el);
                    }
                });
            };
            this.getCommenters = function () {
                _this.url += SGPP.location.code + '/' + SGPP.location.description + '/search?page=';
                _this.page = _this.pageStart;
                _this.getCommentPage();
            };
            this.getCommentPage = function () {
                $.ajax({
                    type: 'GET',
                    url: _this.url + _this.page,
                    success: _this.handleCommentPage
                });
            };
            this.handleCommentPage = function (html) {
                var $html = $(html);
                $('.comment__username', $html).each(function (i, el) {
                    _this.commenters[el.textContent.trim()] = true;
                });
                if (_this.page == _this.pageStart) {
                    var pagination = $('a[data-page-number]', $html);
                    _this.page = pagination.length != 0 ? pagination.last().data().pageNumber : 1;
                }
                if (--_this.page > 0)
                    _this.getCommentPage();
                else
                    _this.cacheCompleted = true;
            };
        }
        EntryCommenters.prototype.init = function () {
        };
        EntryCommenters.prototype.name = function () {
            return "EntryCommenters";
        };
        EntryCommenters.prototype.shouldRun = function (loc) {
            return loc.pageKind == 'giveaway' && (loc.subpage == 'entries' || loc.subpage == 'winners');
        };
        return EntryCommenters;
    })();
    ModuleDefinition.EntryCommenters = EntryCommenters;
})(ModuleDefinition || (ModuleDefinition = {}));
var ModuleDefinition;
(function (ModuleDefinition) {
    var FixedNavbar = (function () {
        function FixedNavbar() {
            this.style = "body.SPGG_FixedNavbar {padding-top: 39px}\n" + "header.SPGG_FixedNavbar {position: fixed; top: 0px; width: 100%; z-index: 100}\n" + ".comment__summary { margin-top: -44px !important; padding-top: 48px !important; }\n" + "a { position: relative; z-index: 99; } ";
            this.shouldRun = function (location) { return true; };
        }
        FixedNavbar.prototype.init = function () {
        };
        FixedNavbar.prototype.render = function () {
            $('body').addClass('SPGG_FixedNavbar');
            $('header').addClass('SPGG_FixedNavbar');
        };
        FixedNavbar.prototype.name = function () {
            return "FixedNavbar";
        };
        return FixedNavbar;
    })();
    ModuleDefinition.FixedNavbar = FixedNavbar;
})(ModuleDefinition || (ModuleDefinition = {}));
var ModuleDefinition;
(function (ModuleDefinition) {
    var FixedFooter = (function () {
        function FixedFooter() {
            this.style = "body.SGPP_FixedFooter {padding-bottom: 45px}\n" + ".footer__outer-wrap.SGPP_FixedFooter_outerWrap {padding: 15px 0px; z-index: 100; bottom: 0px; position: fixed; width: 100%; background: inherit}\n" + ".footer__inner-wrap.SGPP_FixedFooter_innerWrap {margin: 0px 25px}\n";
            this.shouldRun = function (location) { return true; };
        }
        FixedFooter.prototype.init = function () {
        };
        FixedFooter.prototype.render = function () {
            $('body').addClass('SGPP_FixedFooter');
            $('.footer__outer-wrap').addClass('SGPP_FixedFooter_outerWrap');
            $('.footer__inner-wrap').addClass('SGPP_FixedFooter_innerWrap');
        };
        FixedFooter.prototype.name = function () {
            return "FixedFooter";
        };
        return FixedFooter;
    })();
    ModuleDefinition.FixedFooter = FixedFooter;
})(ModuleDefinition || (ModuleDefinition = {}));
var ModuleDefinition;
(function (ModuleDefinition) {
    var GridView = (function () {
        function GridView() {
            var _this = this;
            this.shouldRun = function (location) { return location.pageKind == 'giveaways' && ['created', 'entered', 'won'].indexOf(location.subpage) == -1; };
            this.style = ".gridview_flex{display:flex;flex-wrap:wrap;justify-content:center;margin:0 -5px;}" + ".global__image-outer-wrap--missing-image {height:69px!important}" + ".preview{box-shadow:1px 1px 0 #fff inset,0 7px 7px rgba(255,255,255,.37)inset;background-color:rgba(255,255,255,1);border:1px solid #cbcfdb;padding:5px; z-index:10;}" + ".tile_view_header{min-height:35px;margin-top:5px;font-size:12px}" + ".tile_view_avatar_outer{float:right;display:inline-block;margin-left:5px}" + ".tile_view_avatar{height:24px;width:24px;padding: 2px}" + ".tile_view_faded{opacity:.4}" + ".sidebar--wide{min-width:329px!important}";
            this.init = function () {
            };
            this.render = function () {
                var esg = $('.pagination').prev();
                esg.parent().on("DOMNodeInserted", function (event) {
                    if ($(event.target).hasClass('pagination__navigation'))
                        _this.updateGridview($('.pagination').prev());
                });
                _this.updateGridview(esg);
            };
            this.updateGridview = function (esg) {
                var giveaways = $(document.createElement('div')).wrapInner(esg.children('.giveaway__row-outer-wrap'));
                var gridview = _this.generateGridview(giveaways);
                esg.remove('.giveaway__row-outer-wrap').addClass('SGPP__Gridview').append(gridview);
            };
            this.generateGridview = function (root) {
                function calculateWinChance(copies, entries) {
                    var res = (+(parseFloat(copies) / parseFloat(entries)) * 100);
                    return Math.min(res, 100).toFixed(2);
                }
                var container = document.createElement('div');
                $(container).addClass('gridview_flex');
                $(root).find('.giveaway__row-inner-wrap').each(function () {
                    if ($(this).parents('.pinned-giveaways').length != 0)
                        return;
                    var eachDiv = document.createElement('div');
                    $(this).children('.global__image-outer-wrap--game-medium').removeClass('global__image-outer-wrap--missing-image').children().first().wrap(document.createElement('div')).parent().addClass('global__image-outer-wrap--missing-image');
                    $(eachDiv).append($(this).find('.global__image-outer-wrap--game-medium'));
                    $(eachDiv).css('margin', '5px');
                    var gridview_extra = $('<div class="gridview_extra is-hidden preview" style="position:absolute; width:184px;margin-left:-5.8px; border-top: thick #ffffff;"></div>');
                    var giveawayName = $(this).find('.giveaway__heading__name').text();
                    var avatar = $(this).find('.global__image-outer-wrap--avatar-small');
                    avatar.addClass('tile_view_avatar');
                    var copies = "0";
                    var cost = "0";
                    if ($(this).find('.giveaway__heading__thin').length == 1) {
                        cost = $(this).find('.giveaway__heading__thin').text().replace("(", "").replace(")", "");
                        copies = "1";
                    }
                    else {
                        cost = $(this).find('.giveaway__heading__thin:nth(1)').text().replace("(", "").replace(")", "");
                        copies = $(this).find('.giveaway__heading__thin:nth(0)').text().replace("(", "").replace("Copies)", "");
                    }
                    var timeLeft = $(this).find('.fa-clock-o').next().text();
                    var timeSplit = timeLeft.split(" ");
                    var entries = $(this).find('.fa-tag').next().text();
                    var entriesSplit = entries.split(" ");
                    var comments = $(this).find('.fa-comment').next().text();
                    var commentsSplit = comments.split(" ");
                    var winChance = calculateWinChance(copies, entries.replace(",", ""));
                    if ($(this).hasClass('is-faded'))
                        $(eachDiv).find('.global__image-outer-wrap--missing-image').addClass('tile_view_faded');
                    gridview_extra.append('<div class="giveaway__heading__name tile_view_header">' + giveawayName + '</div>');
                    gridview_extra.append('<div class="tile_view_avatar_outer">' + avatar[0].outerHTML + '</div>');
                    gridview_extra.append('<div style="float:left;"><strong>' + copies + '</strong> Copies</div>');
                    gridview_extra.append('<div style="float:right;"><strong>' + cost + '</strong></div>');
                    gridview_extra.append('<div style="clear:both;"></div>');
                    if (timeSplit[0] === "Ended")
                        gridview_extra.append('<div style="margin-top:-14px;"><strong>' + timeSplit[0] + '</strong></div>');
                    else
                        gridview_extra.append('<div style="margin-top:-14px;"><strong>' + timeSplit[0] + '</strong> ' + timeSplit[1] + '</div>');
                    gridview_extra.append('<div style="clear:both;"></div>');
                    gridview_extra.append('<div style="float:left;"><strong>' + entriesSplit[0] + '</strong> Entries</div>');
                    gridview_extra.append('<div style="float:right;"><strong>' + winChance + '</strong>% Chance</div>');
                    gridview_extra.append('<div style="clear:both;"></div>');
                    gridview_extra.append('<div><strong>' + commentsSplit[0] + '</strong> Comments</div>');
                    $(eachDiv).children().first().append(gridview_extra);
                    $(container).append(eachDiv);
                });
                $(container).append($('<div style="margin-top: 5px; margin-bottom: 20px;width: 0px;height: 69px;"></div>'));
                $(container).find('.global__image-outer-wrap--game-medium').hover(function () {
                    $(this).find('.gridview_extra').removeClass('is-hidden');
                }, function () {
                    $(this).find('.gridview_extra').addClass('is-hidden');
                });
                return container;
            };
        }
        GridView.prototype.name = function () {
            return "GridView";
        };
        return GridView;
    })();
    ModuleDefinition.GridView = GridView;
})(ModuleDefinition || (ModuleDefinition = {}));
var ModuleDefinition;
(function (ModuleDefinition) {
    var LivePreview = (function () {
        function LivePreview() {
            this.style = "";
            this.shouldRun = function (location) { return false; };
        }
        LivePreview.prototype.init = function () {
        };
        LivePreview.prototype.render = function () {
        };
        LivePreview.prototype.name = function () {
            return "LivePreview";
        };
        return LivePreview;
    })();
    ModuleDefinition.LivePreview = LivePreview;
})(ModuleDefinition || (ModuleDefinition = {}));
var ModuleDefinition;
(function (ModuleDefinition) {
    var ScrollingSidebar = (function () {
        function ScrollingSidebar() {
            this.style = "";
            this.shouldRun = function (location) { return true; };
        }
        ScrollingSidebar.prototype.init = function () {
        };
        ScrollingSidebar.prototype.render = function () {
            var side = $('.sidebar');
            var sideOuter = $(document.createElement('div')).addClass(side.attr('class'));
            var sideInner = side.wrapInner(sideOuter).children().first().addClass('SGPP__scrollingSidebar');
            var sideAds = sideInner.children('.adsbygoogle');
            var delayedAdSlider = (function () {
                var timeout;
                return function (up) {
                    clearTimeout(timeout);
                    timeout = setTimeout(function () {
                        if (up)
                            sideAds.stop().slideUp();
                        else
                            sideAds.stop().slideDown();
                    }, 250);
                };
            })();
            var $win = $(window);
            var footerHeight = $('.footer__outer-wrap').outerHeight();
            var $widgetContainer = $('.page__inner-wrap .widget-container');
            var featHeight = $('.featured__container').height();
            var offset = 25;
            var navHeight = 0;
            if (SGPP.modules['FixedNavbar'] !== undefined) {
                offset += $('header').outerHeight();
            }
            else {
                navHeight += $('header').outerHeight();
            }
            $('.featured__inner-wrap .global__image-outer-wrap img').on('load', document, function () {
                featHeight = $('.featured__container').height();
            });
            var handleScrolling = function () {
                var winTop = $win.scrollTop();
                if (winTop + sideInner.height() >= $widgetContainer.position().top + $widgetContainer.height()) {
                    sideInner.css({
                        position: 'fixed',
                        top: '',
                        bottom: footerHeight
                    });
                    delayedAdSlider(true);
                }
                else if (winTop <= featHeight + navHeight) {
                    sideInner.css({
                        position: 'static',
                        top: '',
                        left: ''
                    });
                    delayedAdSlider(false);
                }
                else {
                    sideInner.css({
                        position: 'fixed',
                        top: offset,
                        bottom: ''
                    }).show();
                    delayedAdSlider(true);
                }
            };
            handleScrolling();
            $(document).scroll(handleScrolling);
        };
        ScrollingSidebar.prototype.name = function () {
            return "ScrollingSidebar";
        };
        return ScrollingSidebar;
    })();
    ModuleDefinition.ScrollingSidebar = ScrollingSidebar;
})(ModuleDefinition || (ModuleDefinition = {}));
var ModuleDefinition;
(function (ModuleDefinition) {
    var Settings = (function () {
        function Settings() {
            var _this = this;
            this.style = "";
            this.settingsNavIcon = '<a class="nav__row SGPP__settings">\n' + '<i class="icon-red fa fa-fw fa-bars"> </i>\n' + '<div class="nav__row__summary">\n' + '<p class="nav__row__summary__name" > SG++ Settings</p>\n' + '<p class="nav__row__summary__description"> Steamgifts++ settings.</p>\n' + '</div>\n' + '</a>\n';
            this.settingsPage = function (modules) {
                return '<div class="popup SGPP__settings_popup">\n' + '<p class="popup__heading">Steamgifts++ Settings</p>\n' + '<div class="form__rows" style="max-height:500px; overflow-y:scroll; overflow-x:hidden; min-width:400px;">' + modules + '</div>\n' + '<p class="popup__actions" style="margin-top:5px;">\n' + '<span class="SGPP__settings-save b-close">Save</span>\n' + '<span class="b-close">Close</span>\n' + '</p>\n' + '</div>\n';
            };
            this.moduleSetting = function (num, friendlyName, name, current) {
                return '<div class="form__row" style="margin-bottom:10px;">\n' + '<div class="form__heading"><div class="form__heading__number">' + num + '</div><div class="form__heading__text">' + friendlyName + '</div></div>\n' + '<div class= "form__row__indent">\n' + '<div>\n' + '<input type="hidden" name="' + name + '" value="' + (current ? "1" : "0") + '">\n' + '<div class= "SGPP__settings-checkbox ' + (current ? 'is-selected' : 'is-disabled') + '">\n' + '<i class= "form__checkbox__default fa fa-circle-o"> </i><i class="form__checkbox__hover fa fa-circle"> </i><i class= "form__checkbox__selected fa fa-check-circle"> </i>Enabled\n' + '</div>\n' + '</div>\n' + '</div>\n' + '</div>\n';
            };
            this.init = function () {
            };
            this.render = function () {
                $(".nav__absolute-dropdown a[href^='/?logout']").before(_this.settingsNavIcon);
                var modules = "";
                var i = 0;
                for (var pos in modulesNames) {
                    i++;
                    var SGModule = new ModuleDefinition[modulesNames[pos]]();
                    modules += _this.moduleSetting(i, SGModule.name(), modulesNames[pos], _this.isModuleEnabled(modulesNames[pos]));
                }
                var completeSettingsPage = _this.settingsPage(modules);
                $('.footer__outer-wrap').before(completeSettingsPage);
                $('.SGPP__settings').on('click', _this.handleSettingClick);
                $('.SGPP__settings-save').on("click", _this.handleSaveSettings);
                $('.SGPP__settings-checkbox').on("click", _this.handleSettingsCheckboxClick);
            };
            this.handleSettingsCheckboxClick = function () {
                var input = $(this).siblings("input");
                if ($(this).hasClass('is-selected')) {
                    $(this).removeClass('is-selected');
                    $(this).addClass('is-disabled');
                    input.val('0');
                }
                else {
                    $(this).removeClass('is-disabled');
                    $(this).addClass('is-selected');
                    input.val('1');
                }
            };
            this.handleSettingClick = function () {
                var popup = $(".SGPP__settings_popup").bPopup({ opacity: .85, fadeSpeed: 200, followSpeed: 500, modalColor: "#3c424d" });
                $(".SGPP__settings_popup .SGPP__settings-checkbox").addClass("form__checkbox");
            };
            this.handleSaveSettings = function () {
                $('.SGPP__settings_popup input').each(function (index, element) {
                    var input = $(element);
                    SGPP.storage.setItem(input.attr('name'), input.val());
                });
            };
            this.shouldRun = function (location) { return true; };
            this.isModuleEnabled = function (module) {
                return SGPP.storage.getItem(module) == "1";
            };
        }
        Settings.prototype.name = function () {
            return "Settings";
        };
        return Settings;
    })();
    ModuleDefinition.Settings = Settings;
})(ModuleDefinition || (ModuleDefinition = {}));
var ModuleDefinition;
(function (ModuleDefinition) {
    var topicInfo = (function () {
        function topicInfo(topicID) {
            this._isDataStored = false;
            this.localStorageKey = "endless_scroll_" + topicID;
            if (this.localStorageKey in localStorage) {
                this._obj = JSON.parse(localStorage[this.localStorageKey]);
                if (!("numberOfComments" in this._obj)) {
                    this._obj.numberOfComments = 0;
                }
                if (!("lastSeenPage" in this._obj)) {
                    this._obj.lastSeenPage = 0;
                }
                this._isDataStored = true;
            }
            else {
                this._obj = {
                    lastVisit: Date.now(),
                    lastCommentIDPages: {},
                    numberOfComments: 0
                };
            }
        }
        Object.defineProperty(topicInfo.prototype, "isDataStored", {
            get: function () {
                return this._isDataStored;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(topicInfo.prototype, "lastVisit", {
            get: function () {
                return this._obj.lastVisit;
            },
            enumerable: true,
            configurable: true
        });
        topicInfo.prototype.getNumComments = function () {
            return this._obj.numberOfComments;
        };
        topicInfo.prototype.setLastVisit = function () {
            this._obj.lastVisit = Date.now();
            this.save();
        };
        topicInfo.prototype.setLastSeenPage = function (page) {
            this._obj.lastSeenPage = page;
            this.save();
        };
        topicInfo.prototype.setLastCommentID = function (page, commentID, numComments) {
            this._obj.lastCommentIDPages[page] = commentID;
            this._obj.numberOfComments = numComments;
            this.save();
        };
        topicInfo.prototype.isNewComment = function (page, commentID) {
            if (page in this._obj.lastCommentIDPages)
                return (commentID > this._obj.lastCommentIDPages[page]);
            else
                return true;
        };
        topicInfo.prototype.save = function () {
            localStorage[this.localStorageKey] = JSON.stringify(this._obj);
        };
        return topicInfo;
    })();
    var MarkComments = (function () {
        function MarkComments() {
            this.style = ".endless_new .comment__parent .comment__summary, .endless_new > .comment__child{}" + ".endless_not_new .comment__parent .comment__summary, .endless_not_new > .comment__child{}" + ".endless_not_new:hover .comment__parent .comment__summary, .endless_not_new:hover > .comment__child{}" + ".endless_badge_new {border-radius: 4px; margin-left:5px; padding: 3px 5px; background-color: #C50000;text-shadow: none;color: white; font-weight: bold;}";
        }
        MarkComments.prototype.getDiscussionId = function (url) {
            var match = /(discussion|trade)\/([^/]+)(\/|$)/.exec(url);
            if (!match)
                throw 'No Discussion ID';
            return match[1] + '_' + match[2];
        };
        MarkComments.prototype.getLatestCommentID = function (root) {
            var id = 0;
            $(root).find('.comment[data-comment-id]').each(function (i, el) {
                var n = parseInt($(el).data('comment-id'));
                if (n > id)
                    id = n;
            });
            return id;
        };
        MarkComments.prototype.shouldRun = function () {
            return true;
        };
        MarkComments.prototype.init = function () {
        };
        MarkComments.prototype.render = function () {
            if (SGPP.location.pageKind == 'discussion' || SGPP.location.pageKind == 'trade') {
                this.topicInfo = new topicInfo(this.getDiscussionId(location.pathname));
                var page = 1;
                var currentPageNavEl = $('div.pagination__navigation a.is-selected');
                if (currentPageNavEl.length != 0)
                    page = currentPageNavEl.first().data('page-number');
                this.markComments(document, page, true);
                this.topicInfo.setLastVisit();
            }
            else if (SGPP.location.pageKind == 'discussions' || SGPP.location.pageKind == 'trades') {
                this.markTopics(document);
            }
            else if (SGPP.location.pageKind == 'giveaways' && SGPP.location.subpage == '') {
                this.markTopics($('.widget-container').last().prev().prev());
            }
        };
        MarkComments.prototype.checkNewComments = function (dom, page) {
            var _this = this;
            var has_new = false;
            $(dom).find('.comment[data-comment-id]').each(function (i, el) {
                var id = parseInt($(el).data('comment-id'));
                if (_this.topicInfo.isNewComment(page, id)) {
                    has_new = true;
                }
            });
            return has_new;
        };
        MarkComments.prototype.markComments = function (dom, page, markRead) {
            var _this = this;
            if (markRead === void 0) { markRead = false; }
            $(dom).find('.comment[data-comment-id]').each(function (i, el) {
                var id = parseInt($(el).data('comment-id'));
                if (_this.topicInfo.isNewComment(page, id)) {
                    $(el).addClass('endless_new');
                    $(el).find('.comment__username').first().after($('<span>').addClass('endless_badge_new').text('New').attr('title', 'New since last visit'));
                }
                else {
                    $(el).addClass('endless_not_new');
                }
                if (_this.checkNewComments(el, page)) {
                    $(el).addClass('endless_new_children');
                }
                else {
                    $(el).addClass('endless_no_new_children');
                }
            });
            if (markRead) {
                var numComments = parseInt($('.comments:eq(1)').prev().find('a').text().split(' ')[0]);
                this.topicInfo.setLastCommentID(page, this.getLatestCommentID(dom), numComments);
            }
        };
        MarkComments.prototype.markTopics = function (dom) {
            var _this = this;
            $(dom).find('.table__row-outer-wrap').each(function (i, el) {
                try {
                    var link = $(el).find('h3 a').first();
                    var tInfo = new topicInfo(_this.getDiscussionId(link.attr('href')));
                    if (true) {
                        link.attr('href', link.attr('href') + '/search?page=31337');
                    }
                    if (tInfo.isDataStored) {
                        var numComments = parseInt($(el).find('.table__column--width-small a.table__column__secondary-link').text());
                        var lastComments = tInfo.getNumComments();
                        var newComments = numComments - lastComments;
                        if (newComments > 0) {
                            $(el).addClass('endless_new_comments');
                            if (true)
                                link.after($('<span>').addClass('endless_badge_new').text(newComments).attr('title', newComments + ' new comments since last visit'));
                            else
                                $(el).find('.table__column--width-fill > p').first().append(' - <strong>' + newComments + ' new comments</strong>');
                        }
                        else {
                            $(el).addClass('endless_no_new_comments');
                            $(el).find('.table__column--width-fill > p').first().append(' - no new comments</strong>');
                        }
                    }
                }
                catch (err) {
                }
            });
        };
        MarkComments.prototype.name = function () {
            return "MarkComments";
        };
        return MarkComments;
    })();
    ModuleDefinition.MarkComments = MarkComments;
})(ModuleDefinition || (ModuleDefinition = {}));
var ModuleDefinition;
(function (ModuleDefinition) {
    var EndlessScroll = (function () {
        function EndlessScroll() {
            this._maxPage = 31337;
            this._nextPage = -1;
            this._currentPage = 1;
            this._lastPage = 1;
            this._numberOfPages = -1;
            this._stopped = false;
            this._pages = {};
            this._pagesUrl = {};
        }
        Object.defineProperty(EndlessScroll.prototype, "stopped", {
            get: function () {
                return this._stopped;
            },
            set: function (v) {
                this._stopped = v;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(EndlessScroll.prototype, "currentPage", {
            get: function () {
                return this._currentPage;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(EndlessScroll.prototype, "lastPage", {
            get: function () {
                return this._numberOfPages;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(EndlessScroll.prototype, "reverseItems", {
            get: function () {
                return false;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(EndlessScroll.prototype, "BaseUrl", {
            get: function () {
                throw 'BaseUrl() not implmented';
            },
            enumerable: true,
            configurable: true
        });
        EndlessScroll.prototype.hasPages = function (dom) {
            return $(dom).find('.pagination__navigation').length != 0;
        };
        EndlessScroll.prototype.getNavigationElement = function (dom) {
            return $(dom).find('.pagination').first();
        };
        EndlessScroll.prototype.createPageContainerElement = function () {
            throw 'createPageContainerElement() not implemented';
        };
        EndlessScroll.prototype.getItemsElement = function (dom) {
            throw 'getItemsElement() not implemented';
        };
        EndlessScroll.prototype.getItems = function (dom) {
            throw 'getItems() not implemented';
        };
        EndlessScroll.prototype.createLoadingElement = function () {
            var el = $('<span class="endless_loading"> - <i class="fa fa-refresh fa-spin"></i> Loading...</span>');
            return el;
        };
        EndlessScroll.prototype.createPageElement = function (page) {
            var _this = this;
            var el = $('<div class="table__heading"><div class="table__column--width-fill"><p><span class="endless_page"></span></p></div></div>');
            var $p = el.find('p');
            this.updatePageElement(el, page);
            var controlContainer = $('<div>').addClass('pull-right').addClass('endless_control_element');
            var controlStartStop = $('<a>').attr('href', '#').append('<i class="fa fa-pause"></i>').attr('title', 'Pause/Resume endless scrolling');
            controlStartStop.click(function () {
                _this.stopped = !_this.stopped;
                $('.endless_control_element a i.fa').toggleClass('fa-pause').toggleClass('fa-play');
                return false;
            });
            controlContainer.append(controlStartStop);
            $p.append(controlContainer);
            return el;
        };
        EndlessScroll.prototype.updatePageElement = function (el, page) {
            var text = '';
            if (page > 0) {
                if (this._numberOfPages > 0)
                    text = 'Page ' + page + ' of ' + this._numberOfPages;
                else
                    text = 'Page ' + page;
            }
            else {
                text = 'Last page ends here';
            }
            el.find('.endless_page').text(text);
        };
        EndlessScroll.prototype.loadNextPage = function () {
            if (this._stopped) {
                return;
            }
            if (this._nextPage > this._lastPage || this._nextPage < 1)
                return;
            this.loadPage(this._nextPage);
        };
        EndlessScroll.prototype.updateNextPage = function (page) {
            if (this.reverseItems) {
                this._nextPage = page - 1;
            }
            else {
                this._nextPage = page + 1;
            }
        };
        EndlessScroll.prototype.loadPage = function (page) {
            var _this = this;
            if (!(page in this._pagesUrl)) {
                throw 'No URL for page ' + this._currentPage;
            }
            if (!(page in this._pages)) {
                var diff = -1;
                var target = -1;
                $.each(this._pages, function (i, el) {
                    var thisDiff = Math.abs(i - page);
                    if (target == -1 || diff > thisDiff) {
                        target = i;
                        diff = thisDiff;
                    }
                });
                var pageContainer = this.createPageContainerElement();
                var loadingElement = this.createLoadingElement();
                var pageHeaderElement = this.createPageElement(page);
                pageHeaderElement.find('p').first().append(loadingElement);
                pageContainer.append(pageHeaderElement);
                this._pages[page] = {
                    element: pageContainer,
                    loaded: false,
                    loading: false,
                    visible: true
                };
                var elPage = this._pages[target].element;
                if ((target < page && !this.reverseItems) || (target > page && this.reverseItems)) {
                    elPage.after(pageContainer);
                }
                else {
                    elPage.before(pageContainer);
                }
            }
            var pg = this._pages[page];
            if (pg.loading) {
                return;
            }
            else if (pg.loaded) {
                if (!pg.visible) {
                    pg.element.show();
                    pg.visible = true;
                }
                if (this._nextPage == page) {
                    this.updateNextPage(page);
                }
            }
            else {
                var url = this._pagesUrl[page];
                this._pages[page].loading = true;
                $.get(url, function (data) {
                    var dom = $.parseHTML(data);
                    _this.beforeAddItems(dom, page);
                    var itemsContainer = _this.getItemsElement(dom);
                    var newPagination = _this.getNavigationElement(dom);
                    var actualPage = parseInt(newPagination.find('a.is-selected').data('page-number'));
                    _this.parseNavigation(newPagination);
                    _this.addItems(itemsContainer, pageContainer, page);
                    pageContainer.prepend(pageHeaderElement);
                    _this.getNavigationElement(document).html(newPagination.html());
                    _this.afterAddItems(pageContainer, page);
                    _this._pages[page].loaded = true;
                    loadingElement.remove();
                    if (_this._nextPage == page || _this._nextPage == -1) {
                        _this.updateNextPage(actualPage);
                    }
                    if (actualPage != page) {
                        _this.updatePageElement(pageHeaderElement, actualPage);
                        _this._pages[actualPage] = _this._pages[page];
                        delete _this._pages[page];
                    }
                });
            }
        };
        EndlessScroll.prototype.beforeAddItems = function (dom, page) {
        };
        EndlessScroll.prototype.addItems = function (dom, pageContainer, page) {
            var _this = this;
            this.getItems(dom).each(function (i, el) {
                if (_this.reverseItems) {
                    pageContainer.prepend(el);
                }
                else {
                    pageContainer.append(el);
                }
            });
        };
        EndlessScroll.prototype.afterAddItems = function (pageContainer, page) {
        };
        EndlessScroll.prototype.parseNavigation = function (dom) {
            var _this = this;
            var elLastPage = dom.find('a').last();
            this._lastPage = parseInt(elLastPage.data('page-number'));
            if (elLastPage.text().trim() != "Next") {
                this._numberOfPages = this._lastPage;
            }
            dom.find('.pagination__navigation a').each(function (i, el) {
                var $el = $(el);
                var page = parseInt($el.data('page-number'));
                _this._pagesUrl[page] = $el.attr('href');
                if (page > _this._lastPage)
                    _this._lastPage = page;
            });
        };
        EndlessScroll.prototype.preparePage = function () {
            var _this = this;
            var nav = this.getNavigationElement(document);
            if (nav.hasClass('pagination--no-results'))
                return;
            if (!this.hasPages(document)) {
                this._currentPage = 1;
                this._lastPage = 1;
                this._numberOfPages = 1;
            }
            else {
                this._currentPage = parseInt(nav.find('a.is-selected').data('page-number'));
                this.parseNavigation(nav);
            }
            var itemsElement = this.getItemsElement(document);
            var pageHeader = this.createPageElement(this.currentPage);
            var isCommentLink = SGPP.location.hash != '';
            this._pages[this.currentPage] = {
                element: itemsElement,
                loaded: true,
                loading: false,
                visible: true
            };
            if (this.reverseItems) {
                this.getItems(itemsElement).each(function (i, el) {
                    itemsElement.prepend(el);
                });
                if (this._currentPage == 1 && this._numberOfPages > 1 && !isCommentLink) {
                    this._nextPage = this._lastPage;
                    this.loadNextPage();
                    this._pages[this.currentPage].visible = false;
                    itemsElement.hide();
                }
                else if (this._currentPage == 1 && this._numberOfPages == -1 && !isCommentLink) {
                    this._pagesUrl[this._maxPage] = this.BaseUrl + '/search?page=' + this._maxPage;
                    this._pages[this.currentPage].visible = false;
                    itemsElement.hide();
                    this.loadPage(this._maxPage);
                }
                else {
                    this._nextPage = this._lastPage - 1;
                }
            }
            else {
                this._nextPage = this._currentPage + 1;
            }
            itemsElement.prepend(pageHeader);
            if (isCommentLink) {
                var linkedComment = $("#" + SGPP.location.hash);
                $(window).scrollTop(linkedComment.offset().top);
            }
            $(window).scroll(function (event) {
                var scrollPos = $(window).scrollTop() + $(window).height();
                if (scrollPos > $('div.pagination').position().top - 200) {
                    _this.loadNextPage();
                }
            });
            $(window).scroll();
        };
        return EndlessScroll;
    })();
    ModuleDefinition.EndlessScroll = EndlessScroll;
})(ModuleDefinition || (ModuleDefinition = {}));
var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var ModuleDefinition;
(function (ModuleDefinition) {
    var EndlessScrollDiscussion = (function (_super) {
        __extends(EndlessScrollDiscussion, _super);
        function EndlessScrollDiscussion() {
            _super.apply(this, arguments);
            this.style = "";
        }
        EndlessScrollDiscussion.prototype.shouldRun = function () {
            return SGPP.location.pageKind == 'discussions' || SGPP.location.pageKind == 'trades';
        };
        EndlessScrollDiscussion.prototype.init = function () {
        };
        EndlessScrollDiscussion.prototype.render = function () {
            this.preparePage();
        };
        EndlessScrollDiscussion.prototype.createPageContainerElement = function () {
            return $('<div class="table__rows">');
        };
        EndlessScrollDiscussion.prototype.getItemsElement = function (dom) {
            return $(dom).find('.table__rows').first();
        };
        EndlessScrollDiscussion.prototype.getItems = function (dom) {
            return dom.children('.table__row-outer-wrap');
        };
        EndlessScrollDiscussion.prototype.beforeAddItems = function (dom) {
            if ("MarkComments" in SGPP.modules) {
                var MarkComments = SGPP.modules["MarkComments"];
                MarkComments.markTopics(dom);
            }
        };
        EndlessScrollDiscussion.prototype.name = function () {
            return "EndlessScrollDiscussion";
        };
        return EndlessScrollDiscussion;
    })(ModuleDefinition.EndlessScroll);
    ModuleDefinition.EndlessScrollDiscussion = EndlessScrollDiscussion;
})(ModuleDefinition || (ModuleDefinition = {}));
var ModuleDefinition;
(function (ModuleDefinition) {
    var EndlessScrollDiscussionReplies = (function (_super) {
        __extends(EndlessScrollDiscussionReplies, _super);
        function EndlessScrollDiscussionReplies() {
            _super.apply(this, arguments);
            this.style = "";
        }
        EndlessScrollDiscussionReplies.prototype.shouldRun = function () {
            return SGPP.location.pageKind == 'discussion' || SGPP.location.pageKind == 'trade';
        };
        EndlessScrollDiscussionReplies.prototype.init = function () {
        };
        EndlessScrollDiscussionReplies.prototype.render = function () {
            if (true) {
                var addReply = $('.comment--submit').first();
                if (addReply.length == 1) {
                    var elCommentHeader = $('<div id="esc_reply_header" class="page__heading"><div class="page__heading__breadcrumbs">Reply</div></div>');
                    if ($('.poll').length == 0)
                        $('.comments').first().after(elCommentHeader);
                    else
                        $('.poll').first().after(elCommentHeader);
                    $('#esc_reply_header').after(addReply);
                    $('.js__comment-reply-cancel').on('click', function () {
                        setTimeout(function () {
                            addReply.insertAfter('#esc_reply_header');
                        }, 10);
                    });
                }
            }
            this.preparePage();
        };
        Object.defineProperty(EndlessScrollDiscussionReplies.prototype, "BaseUrl", {
            get: function () {
                return '/' + SGPP.location.pageKind + '/' + SGPP.location.code + '/' + SGPP.location.description;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(EndlessScrollDiscussionReplies.prototype, "reverseItems", {
            get: function () {
                return true;
            },
            enumerable: true,
            configurable: true
        });
        EndlessScrollDiscussionReplies.prototype.createPageContainerElement = function () {
            return $('<div class="comments">');
        };
        EndlessScrollDiscussionReplies.prototype.getItemsElement = function (dom) {
            return $(dom).find('.comments:eq(1)');
        };
        EndlessScrollDiscussionReplies.prototype.getItems = function (dom) {
            return dom.children('.comment');
        };
        EndlessScrollDiscussionReplies.prototype.beforeAddItems = function (dom, page) {
            if ("MarkComments" in SGPP.modules) {
                var MarkComments = SGPP.modules["MarkComments"];
                MarkComments.markComments(dom, page, true);
            }
        };
        EndlessScrollDiscussionReplies.prototype.name = function () {
            return "EndlessScrollDiscussionReplies";
        };
        return EndlessScrollDiscussionReplies;
    })(ModuleDefinition.EndlessScroll);
    ModuleDefinition.EndlessScrollDiscussionReplies = EndlessScrollDiscussionReplies;
})(ModuleDefinition || (ModuleDefinition = {}));
var ModuleDefinition;
(function (ModuleDefinition) {
    var EndlessScrollGiveawayComments = (function (_super) {
        __extends(EndlessScrollGiveawayComments, _super);
        function EndlessScrollGiveawayComments() {
            _super.apply(this, arguments);
            this.style = "";
        }
        EndlessScrollGiveawayComments.prototype.shouldRun = function () {
            return SGPP.location.pageKind == 'giveaway' && SGPP.location.subpage == '';
        };
        EndlessScrollGiveawayComments.prototype.init = function () {
        };
        EndlessScrollGiveawayComments.prototype.render = function () {
            if (true) {
                var addReply = $('.comment--submit').first();
                var elCommentHeader = $('<div id="esc_reply_header" class="page__heading"><div class="page__heading__breadcrumbs">Reply</div></div>');
                $('.comments').prev().before(elCommentHeader);
                $('#esc_reply_header').after(addReply);
                $('.js__comment-reply-cancel').on('click', function () {
                    setTimeout(function () {
                        addReply.insertAfter('#esc_reply_header');
                    }, 10);
                });
            }
            this.preparePage();
        };
        EndlessScrollGiveawayComments.prototype.createPageContainerElement = function () {
            return $('<div class="comments">');
        };
        EndlessScrollGiveawayComments.prototype.getItemsElement = function (dom) {
            return $(dom).find('.comments').first();
        };
        EndlessScrollGiveawayComments.prototype.getItems = function (dom) {
            return dom.children('.comment');
        };
        EndlessScrollGiveawayComments.prototype.name = function () {
            return "EndlessScrollGiveawayComments";
        };
        return EndlessScrollGiveawayComments;
    })(ModuleDefinition.EndlessScroll);
    ModuleDefinition.EndlessScrollGiveawayComments = EndlessScrollGiveawayComments;
})(ModuleDefinition || (ModuleDefinition = {}));
var ModuleDefinition;
(function (ModuleDefinition) {
    var EndlessScrollGiveaways = (function (_super) {
        __extends(EndlessScrollGiveaways, _super);
        function EndlessScrollGiveaways() {
            _super.apply(this, arguments);
            this._location = 'frontpage';
            this.style = "";
        }
        EndlessScrollGiveaways.prototype.shouldRun = function () {
            if (SGPP.location.pageKind == 'giveaways') {
                return !(SGPP.location.subpage == 'entered' || SGPP.location.subpage == 'created' || SGPP.location.subpage == 'won');
            }
            else if (/^\/user\/[^\/]+(\/giveaways\/won([^\/]+)?)?$/.test(location.pathname)) {
                this._location = 'profile';
                return true;
            }
            return false;
        };
        EndlessScrollGiveaways.prototype.init = function () {
        };
        EndlessScrollGiveaways.prototype.render = function () {
            this.preparePage();
        };
        EndlessScrollGiveaways.prototype.createPageContainerElement = function () {
            return $('<div>');
        };
        EndlessScrollGiveaways.prototype.getItemsElement = function (dom) {
            return $(dom).find('.pagination').prev();
        };
        EndlessScrollGiveaways.prototype.getItems = function (dom) {
            return dom.children('.giveaway__row-outer-wrap');
        };
        EndlessScrollGiveaways.prototype.afterAddItems = function (pageContainer) {
            pageContainer.find(".giveaway__hide").click(function () {
                $(".popup--hide-games input[name=game_id]").val($(this).attr("data-game-id"));
                $(".popup--hide-games .popup__heading__bold").text($(this).closest("h2").find(".giveaway__heading__name").text());
            });
            pageContainer.find(".trigger-popup").click(function () {
                var a = $("." + $(this).attr("data-popup"));
                a.bPopup({
                    opacity: .85,
                    fadeSpeed: 200,
                    followSpeed: 500,
                    modalColor: "#3c424d"
                });
            });
        };
        EndlessScrollGiveaways.prototype.name = function () {
            return "EndlessScrollGiveaways";
        };
        return EndlessScrollGiveaways;
    })(ModuleDefinition.EndlessScroll);
    ModuleDefinition.EndlessScrollGiveaways = EndlessScrollGiveaways;
})(ModuleDefinition || (ModuleDefinition = {}));
var ModuleDefinition;
(function (ModuleDefinition) {
    var EndlessScrollMyGiveaways = (function (_super) {
        __extends(EndlessScrollMyGiveaways, _super);
        function EndlessScrollMyGiveaways() {
            _super.apply(this, arguments);
            this.style = "";
        }
        EndlessScrollMyGiveaways.prototype.shouldRun = function () {
            if (SGPP.location.pageKind == 'giveaways') {
                return SGPP.location.subpage == 'entered' || SGPP.location.subpage == 'created' || SGPP.location.subpage == 'won';
            }
            else if (SGPP.location.pageKind == 'bundle-games') {
                return true;
            }
            else if (SGPP.location.pageKind == 'giveaway') {
                return SGPP.location.subpage == 'entries' || SGPP.location.subpage == 'winners' || SGPP.location.subpage == 'groups';
            }
            return false;
        };
        EndlessScrollMyGiveaways.prototype.init = function () {
        };
        EndlessScrollMyGiveaways.prototype.render = function () {
            this.preparePage();
        };
        EndlessScrollMyGiveaways.prototype.createPageContainerElement = function () {
            return $('<div class="table__rows">');
        };
        EndlessScrollMyGiveaways.prototype.getItemsElement = function (dom) {
            return $(dom).find('.table__rows').first();
        };
        EndlessScrollMyGiveaways.prototype.getItems = function (dom) {
            return dom.children('.table__row-outer-wrap');
        };
        EndlessScrollMyGiveaways.prototype.afterAddItems = function (dom) {
            $(dom).find(".table__remove-default").click(function () {
                var e = $(this);
                e.addClass("is-hidden");
                e.siblings(".table__remove-loading").removeClass("is-hidden");
                $.ajax({
                    url: "/ajax.php",
                    type: "POST",
                    dataType: "json",
                    data: e.closest("form").serialize(),
                    success: function (t) {
                        e.siblings(".table__remove-loading").addClass("is-hidden");
                        e.siblings(".table__remove-complete").removeClass("is-hidden");
                        e.closest(".table__row-inner-wrap").addClass("is-faded");
                        if (typeof t.points !== "undefined" && t.points !== false) {
                            $(".nav__points").text(t.points);
                        }
                    }
                });
            });
        };
        EndlessScrollMyGiveaways.prototype.name = function () {
            return "EndlessScrollMyGiveaways";
        };
        return EndlessScrollMyGiveaways;
    })(ModuleDefinition.EndlessScroll);
    ModuleDefinition.EndlessScrollMyGiveaways = EndlessScrollMyGiveaways;
})(ModuleDefinition || (ModuleDefinition = {}));
var SGPP = new ModuleDefinition.Core();
var modulesNames = new Array("CommentAndEnter", "EntryCommenters", "FixedNavbar", "FixedFooter", "GridView", "ScrollingSidebar", "MarkComments", "EndlessScrollDiscussion", "EndlessScrollDiscussionReplies", "EndlessScrollGiveaways", "EndlessScrollMyGiveaways", "EndlessScrollGiveawayComments");
var defaultModules = new Array("FixedNavbar", "ScrollingSidebar");
(function ($) {
    for (var pos in defaultModules) {
        if (!SGPP.storage.containsItem(defaultModules[pos])) {
            SGPP.storage.setItem(defaultModules[pos], "1");
        }
    }
    for (var pos in modulesNames) {
        var m = new ModuleDefinition[modulesNames[pos]]();
        if (SGPP.settings.isModuleEnabled(modulesNames[pos]) && m.shouldRun(SGPP.location))
            SGPP.modules[m.name()] = m;
    }
    for (var module in SGPP.modules) {
        SGPP.log("Module " + SGPP.modules[module].name() + " append css.");
        SGPP.appendCSS(SGPP.modules[module].style);
        SGPP.log("Module " + SGPP.modules[module].name() + " init() call.");
        SGPP.modules[module].init();
    }
    $(document).on("DOMContentLoaded", function () {
        SGPP.render();
        for (var module in SGPP.modules) {
            SGPP.log("Module " + module + " render() call.");
            SGPP.modules[module].render();
        }
    });
})(jQuery);
