'use strict';

System.register(['moment', 'jquery', 'lodash', 'jquery.flot', 'jquery.flot.gauge', 'jquery.flot.pie', 'app/core/utils/kbn', 'app/core/config', 'app/core/time_series2', 'app/plugins/sdk'], function (_export, _context) {
  "use strict";

  var moment, $, _, kbn, config, TimeSeries, MetricsPanelCtrl, _createClass, StatWarningCtrl;

  function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
      throw new TypeError("Cannot call a class as a function");
    }
  }

  function _possibleConstructorReturn(self, call) {
    if (!self) {
      throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
    }

    return call && (typeof call === "object" || typeof call === "function") ? call : self;
  }

  function _inherits(subClass, superClass) {
    if (typeof superClass !== "function" && superClass !== null) {
      throw new TypeError("Super expression must either be null or a function, not " + typeof superClass);
    }

    subClass.prototype = Object.create(superClass && superClass.prototype, {
      constructor: {
        value: subClass,
        enumerable: false,
        writable: true,
        configurable: true
      }
    });
    if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass;
  }

  return {
    setters: [function (_moment) {
      moment = _moment.default;
    }, function (_jquery) {
      $ = _jquery.default;
    }, function (_lodash) {
      _ = _lodash.default;
    }, function (_jqueryFlot) {}, function (_jqueryFlotGauge) {}, function (_jqueryFlotPie) {}, function (_appCoreUtilsKbn) {
      kbn = _appCoreUtilsKbn.default;
    }, function (_appCoreConfig) {
      config = _appCoreConfig.default;
    }, function (_appCoreTime_series) {
      TimeSeries = _appCoreTime_series.default;
    }, function (_appPluginsSdk) {
      MetricsPanelCtrl = _appPluginsSdk.MetricsPanelCtrl;
    }],
    execute: function () {
      _createClass = function () {
        function defineProperties(target, props) {
          for (var i = 0; i < props.length; i++) {
            var descriptor = props[i];
            descriptor.enumerable = descriptor.enumerable || false;
            descriptor.configurable = true;
            if ("value" in descriptor) descriptor.writable = true;
            Object.defineProperty(target, descriptor.key, descriptor);
          }
        }

        return function (Constructor, protoProps, staticProps) {
          if (protoProps) defineProperties(Constructor.prototype, protoProps);
          if (staticProps) defineProperties(Constructor, staticProps);
          return Constructor;
        };
      }();

      _export('StatWarningCtrl', StatWarningCtrl = function (_MetricsPanelCtrl) {
        _inherits(StatWarningCtrl, _MetricsPanelCtrl);

        function StatWarningCtrl($scope, $injector) {
          _classCallCheck(this, StatWarningCtrl);

          var _this = _possibleConstructorReturn(this, (StatWarningCtrl.__proto__ || Object.getPrototypeOf(StatWarningCtrl)).call(this, $scope, $injector));

          var panelDefaults = {
            legend: {
              show: true, // disable/enable legend
              values: true
            },
            threshold: {
              warningAbove: {
                value: 0,
                set: false
              },
              criticalAbove: {
                value: 0,
                set: false
              },
              warningBelow: {
                value: 0,
                set: false
              },
              criticalBelow: {
                value: 0,
                set: false
              }
            },
            values: {
              showValue: true
            },
            width: 100,
            height: 100,
            fontSize: '25px',
            fontWeight: '10px',
            font: { family: 'Myriad Set Pro, Helvetica Neue, Helvetica, Arial, sans-serif' },
            statData: {},
            message: "",
            image: "default.png",
            text: {
              title: '',
              name: '',
              subText: ''
            }
          };
          _.defaults(_this.panel, panelDefaults);
          _.defaults(_this.panel.legend, panelDefaults.legend);
          _this.events.on('init-edit-mode', _this.onInitEditMode.bind(_this));
          _this.events.on('data-received', _this.onDataReceived.bind(_this));
          _this.events.on('data-snapshot-load', _this.onDataReceived.bind(_this));
          _this.events.on('panel-initialized', _this.render.bind(_this));
          //this.events.on('panel-teardown', this.onPanelTeardown.bind(this));
          _this.metrics = {};
          return _this;
        }

        _createClass(StatWarningCtrl, [{
          key: 'onInitEditMode',
          value: function onInitEditMode() {
            this.addEditorTab('Options', 'public/plugins/grafana-statwarning-panel/editor.html', 2);
          }
        }, {
          key: 'onDataReceived',
          value: function onDataReceived(dataList) {

            this.series = dataList.map(this.seriesHandler.bind(this));

            this.setValues(this.metrics);

            this.checkThresholds();
            this.render();
          }
        }, {
          key: 'seriesHandler',
          value: function seriesHandler(seriesData) {
            var series = new TimeSeries({
              datapoints: seriesData.datapoints,
              alias: seriesData.target
            });
            series.flotpairs = series.getFlotPairs(this.panel.nullPointMode);

            return series;
          }
        }, {
          key: 'increaseSize',
          value: function increaseSize() {
            this.panel.width += 10;
            this.panel.height += 10;
          }
        }, {
          key: 'decreaseSize',
          value: function decreaseSize() {
            this.panel.width -= 10;
            this.panel.height -= 10;
          }
        }, {
          key: 'checkThresholds',
          value: function checkThresholds() {

            if (!this.metrics.valueFormated) {
              this.panel.image = "default.png";
              this.panel.message = "";
              return;
            }

            if (this.panel.threshold.criticalAbove.set) {
              if (this.metrics.valueFormated >= this.panel.threshold.criticalAbove.value) {
                this.panel.image = "status_criticalmax.png";
                this.panel.message = "CRITICAL";
                return;
              }
            }

            if (this.panel.threshold.warningAbove.set) {
              if (!this.panel.threshold.criticalAbove.set || this.panel.threshold.criticalAbove.set && this.metrics.valueFormated <= this.panel.threshold.criticalAbove.value) {
                if (this.metrics.valueFormated >= this.panel.threshold.warningAbove.value) {
                  this.panel.image = "status_warningmax.png";
                  this.panel.message = "WARNING";
                  return;
                }
              }
            }

            if (this.panel.threshold.criticalBelow.set) {
              if (this.metrics.valueFormated <= this.panel.threshold.criticalBelow.value) {
                this.panel.image = "status_criticalmin.png";
                this.panel.message = "CRITICAL";
                return;
              }
            }

            if (this.panel.threshold.warningBelow.set) {
              if (!this.panel.threshold.criticalBelow.set || this.panel.threshold.criticalBelow.set && this.metrics.valueFormated >= this.panel.threshold.criticalBelow.value) {
                if (this.metrics.valueFormated <= this.panel.threshold.warningBelow.value) {
                  this.panel.image = "status_warningmin.png";
                  this.panel.message = "WARNING";
                  return;
                }
              }
            }

            this.panel.image = "status_ok.png";
            this.panel.message = "OK";
          }
        }, {
          key: 'setThresholds',
          value: function setThresholds(stat) {
            stat.set = true;
            this.render();
          }
        }, {
          key: 'statName',
          value: function statName() {

            if (this.panel.text.name.length === 0 && this.metrics.name) {
              return this.metrics.name;
            } else if (this.panel.text.name.length !== 0) {
              return this.panel.text.name;
            } else {
              return "N/A";
            }
          }
        }, {
          key: 'setMessage',
          value: function setMessage() {
            if (this.panel.message.length !== 0) {
              return this.panel.message + " - ";
            } else {
              return "";
            }
          }
        }, {
          key: 'setValues',
          value: function setValues(data) {

            if (this.series.length === 0) {
              this.metrics = {};
              return;
            }

            data.flotpairs = [];

            if (this.series.length > 1) {
              var error = {};
              error.message = 'Multiple Series Error';
              error.data = 'Metric query returns ' + this.series.length + ' series. Single Stat Panel expects a single series.\n\nResponse:\n' + JSON.stringify(this.series);
              throw error;
            }

            if (this.series && this.series.length > 0) {
              var lastPoint = _.last(this.series[0].datapoints);
              var lastValue = _.isArray(lastPoint) ? lastPoint[0] : null;

              if (this.panel.valueName === 'name') {
                data.value = 0;
                data.valueRounded = 0;
                data.valueFormated = parseFloat(this.series[0].alias);
                data.name = this.series[0].alias;
              } else if (_.isString(lastValue)) {
                data.value = 0;
                data.valueFormated = parseFloat(_.escape(lastValue));
                data.valueRounded = 0;
                data.name = this.series[0].alias;
              } else {
                data.value = this.series[0].stats[this.panel.valueName];
                data.flotpairs = this.series[0].flotpairs;

                var decimalInfo = this.getDecimalsForValue(data.value);
                var formatFunc = kbn.valueFormats[this.panel.format];
                data.valueFormated = parseInt(_.escape(lastValue));
                data.valueRounded = kbn.roundValue(data.value, decimalInfo.decimals);
                data.name = this.series[0].alias;
              }
            }
          }
        }, {
          key: 'getDecimalsForValue',
          value: function getDecimalsForValue(value) {
            if (_.isNumber(this.panel.decimals)) {
              return { decimals: this.panel.decimals, scaledDecimals: null };
            }

            var delta = value / 2;
            var dec = -Math.floor(Math.log(delta) / Math.LN10);

            var magn = Math.pow(10, -dec),
                norm = delta / magn,
                // norm is between 1.0 and 10.0
            size;

            if (norm < 1.5) {
              size = 1;
            } else if (norm < 3) {
              size = 2;
              // special case for 2.5, requires an extra decimal
              if (norm > 2.25) {
                size = 2.5;
                ++dec;
              }
            } else if (norm < 7.5) {
              size = 5;
            } else {
              size = 10;
            }

            size *= magn;

            // reduce starting decimals if not needed
            if (Math.floor(value) === value) {
              dec = 0;
            }

            var result = {};
            result.decimals = Math.max(0, dec);
            result.scaledDecimals = result.decimals - Math.floor(Math.log(size) / Math.LN10) + 2;

            return result;
          }
        }, {
          key: 'link',
          value: function link(scope, elem) {
            var _this2 = this;

            this.events.on('render', function () {
              var $panelContainer = elem.find('.panel-container');
              if (_this2.panel.bgColor) {
                $panelContainer.css('background-color', _this2.panel.bgColor);
              } else {
                $panelContainer.css('background-color', '');
              }
            });
          }
        }]);

        return StatWarningCtrl;
      }(MetricsPanelCtrl));

      _export('StatWarningCtrl', StatWarningCtrl);

      StatWarningCtrl.templateUrl = 'module.html';
    }
  };
});
//# sourceMappingURL=statwarning_ctrl.js.map
