
import moment from 'moment';


import $ from 'jquery';
import _ from 'lodash';
import 'jquery.flot';
import 'jquery.flot.gauge';
import 'jquery.flot.pie';

import kbn from 'app/core/utils/kbn';
import config from 'app/core/config';
import TimeSeries from 'app/core/time_series2';
import {MetricsPanelCtrl} from 'app/plugins/sdk';

export class StatWarningCtrl extends MetricsPanelCtrl {
  constructor($scope,$injector){
    super($scope,$injector);
    const panelDefaults = {
      legend: {
        show: true, // disable/enable legend
        values: true
      },
      threshold:{
        warningAbove:{
          value:0,
          set:false
        },
        criticalAbove:{
          value:0,
          set:false
        },
        warningBelow:{
          value:0,
          set:false
        },
        criticalBelow:{
          value:0,
          set:false
        }
      },
      values:{
        showValue:true
      },
      width:100,
      height:100,
      fontSize: '25px',
      fontWeight: '10px',
      font: { family: 'Myriad Set Pro, Helvetica Neue, Helvetica, Arial, sans-serif' },
      statData:{},
      message:"",
      image:"default.png",
      text:{
        title:'',
        name:'',
        subText:''
      }
    }
    _.defaults(this.panel, panelDefaults);
    _.defaults(this.panel.legend, panelDefaults.legend);
    this.events.on('init-edit-mode',this.onInitEditMode.bind(this));
    this.events.on('data-received', this.onDataReceived.bind(this));
    this.events.on('data-snapshot-load', this.onDataReceived.bind(this));
    this.events.on('panel-initialized', this.render.bind(this));
    //this.events.on('panel-teardown', this.onPanelTeardown.bind(this));
    this.metrics = {};
  }
  onInitEditMode() {
    this.addEditorTab('Options','public/plugins/grafana-statwarning-panel/editor.html',2);
  }


  onDataReceived(dataList) {

    this.series = dataList.map(this.seriesHandler.bind(this));

    this.setValues(this.metrics);

    this.checkThresholds();
    this.render();
  }

  seriesHandler(seriesData) {
    var series = new TimeSeries({
      datapoints: seriesData.datapoints,
      alias: seriesData.target,
    });
    series.flotpairs = series.getFlotPairs(this.panel.nullPointMode);

    return series;
  }

  increaseSize(){
    this.panel.width += 10;
    this.panel.height += 10;
  }


  decreaseSize(){
    this.panel.width -= 10;
    this.panel.height -= 10;
  }

  checkThresholds(){

    if(!this.metrics.valueFormated){
      this.panel.image = "default.png";
      this.panel.message = "";
      return;
    }

    if(this.panel.threshold.criticalAbove.set){
      if(this.metrics.valueFormated >= this.panel.threshold.criticalAbove.value){
        this.panel.image = "status_criticalmax.png";
        this.panel.message = "CRITICAL";
        return;
      }
    }

    if(this.panel.threshold.warningAbove.set){
      if(!this.panel.threshold.criticalAbove.set || (this.panel.threshold.criticalAbove.set && this.metrics.valueFormated <= this.panel.threshold.criticalAbove.value)){
        if(this.metrics.valueFormated >= this.panel.threshold.warningAbove.value){
          this.panel.image = "status_warningmax.png";
          this.panel.message = "WARNING";
          return;
        }
      }
    }

    if(this.panel.threshold.criticalBelow.set){
      if(this.metrics.valueFormated <= this.panel.threshold.criticalBelow.value){
        this.panel.image = "status_criticalmin.png";
        this.panel.message = "CRITICAL";
        return;
      }
    }

    if(this.panel.threshold.warningBelow.set){
      if(!this.panel.threshold.criticalBelow.set || (this.panel.threshold.criticalBelow.set && this.metrics.valueFormated >= this.panel.threshold.criticalBelow.value)){
        if(this.metrics.valueFormated <= this.panel.threshold.warningBelow.value){
          this.panel.image = "status_warningmin.png";
          this.panel.message = "WARNING";
          return;
        }
      }
    }

    this.panel.image = "status_ok.png";
    this.panel.message = "OK";

  }

  setThresholds(stat){
    stat.set = true;
    this.render();
  }

  statName(){

    if(this.panel.text.name.length === 0 && this.metrics.name){
      return this.metrics.name;
    } else if(this.panel.text.name.length !== 0){
      return this.panel.text.name;
    } else {
      return "N/A"
    }
  }

  setMessage(){
    if(this.panel.message.length !== 0){
      return this.panel.message + " - ";
    } else {
      return "";
    }
  }

  setValues(data) {



    if(this.series.length === 0){
      this.metrics = {};
      return;
    }

    data.flotpairs = [];

    if (this.series.length > 1) {
      var error = {}
      error.message = 'Multiple Series Error';
      error.data = 'Metric query returns ' + this.series.length +
        ' series. Single Stat Panel expects a single series.\n\nResponse:\n'+JSON.stringify(this.series);
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


  getDecimalsForValue(value) {
    if (_.isNumber(this.panel.decimals)) {
      return {decimals: this.panel.decimals, scaledDecimals: null};
    }

    var delta = value / 2;
    var dec = -Math.floor(Math.log(delta) / Math.LN10);

    var magn = Math.pow(10, -dec),
      norm = delta / magn, // norm is between 1.0 and 10.0
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
    if (Math.floor(value) === value) { dec = 0; }

    var result = {};
    result.decimals = Math.max(0, dec);
    result.scaledDecimals = result.decimals - Math.floor(Math.log(size) / Math.LN10) + 2;

    return result;
  }

  link(scope, elem) {
    this.events.on('render', () => {
      const $panelContainer = elem.find('.panel-container');
      if (this.panel.bgColor) {
        $panelContainer.css('background-color', this.panel.bgColor);
      } else {
        $panelContainer.css('background-color', '');
      }

    });
  }
}

StatWarningCtrl.templateUrl = 'module.html';
