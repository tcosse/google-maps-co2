import { Controller } from "@hotwired/stimulus"
import JSZip from 'jszip';
import * as Chartjs from "chart.js";

const monthList = ['JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE', 'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER']

export default class extends Controller {
  static targets = ['file','chart']

  connect() {
    console.log('file uploader')
  }

  fileLoaded(event) {
    event.preventDefault()
    console.log('file loaded')
    const zipfile = this.fileTarget.files[0]
    getZippedData(zipfile).then(compiledData => {
      console.log(compiledData)
      const distanceByActivityAndYear = groupAndSumByProperties(compiledData, ["activity", "year"], "distance")
      console.log(distanceByActivityAndYear)
      console.log('minMax', minMax(distanceByActivityAndYear))
      console.log(createBarChart(this.chartTarget, distanceByActivityAndYear))
    });
  }

}

function getZippedData(zipfile) {
  return new Promise((resolve, reject) => {
    let activityData = [];
    JSZip.loadAsync(zipfile).then((unzipped) => {
      const regex = /Semantic Location History\/\d{4}\/(\d{4})_([A-Z]+)\.json/;
      const promises = [];
      unzipped.forEach((filepath, zipentry) => {
        if (regex.test(filepath)) {
          var matches = filepath.match(regex)
          var year = parseInt(matches[1])
          var month = matches[2]
          promises.push(zipentry.async('string').then((filedata) => {
            filedata = JSON.parse(filedata)
            const data = filedata.timelineObjects.reduce((acc, history_item) => {
              if ('activitySegment' in history_item) {
                acc.push({
                    year: year,
                    month: month,
                    confidence: history_item.activitySegment.confidence,
                    activity: history_item.activitySegment.activityType,
                    distance: history_item.activitySegment.distance,
                    duration: history_item.activitySegment.duration,
                    startLocation: { latitudeE7: history_item.activitySegment.startLocation.latitudeE7, longitudeE7: history_item.activitySegment.startLocation.longitudeE7 },
                    endLocation: { latitudeE7: history_item.activitySegment.endLocation.latitudeE7, longitudeE7: history_item.activitySegment.endLocation.longitudeE7 },
                });
              }
              return acc;
            }, []);
            return data;
          }));
        }
      });

      Promise.all(promises)
        .then(results => {
          results.forEach(data => {
            activityData = activityData.concat(data);
          });
          resolve(activityData);
        })
        .catch(reject);
    });
  });
}

function groupAndSumByProperties(data, groupByProperties, sumProperty) {
  const groupedSum = data.reduce((acc, obj) => {
    const key = groupByProperties.map(prop => obj[prop]).join('-');

    if (!acc[key]) {
      acc[key] = {
        ...groupByProperties.reduce((result, prop) => {
          result[prop] = obj[prop];
          return result;
        }, {}),
        [sumProperty]: obj[sumProperty]
      };
    } else {
      acc[key][sumProperty] += obj[sumProperty];
    }

    return acc;
  }, {});

  const result = Object.values(groupedSum);
  return cleanData(result);
}

function groupByActivity(data){
  return data.reduce((acc, cur) => {
    acc[cur['activity']] = acc[cur['activity']] || {}; // if the key is new, initiate its value to an object, otherwise keep its own array value
    acc[cur['activity']][cur['year']] = cur['distance'];
    return acc;
  }, {})
}

function cleanData(data){
  const cleanedData = []
  data.forEach((elem) => {
    if (!Number.isNaN(elem.distance) && elem.activity !== undefined ) {
      cleanedData.push(elem)
    }
  })
  return cleanedData;
}

function minMax(data){
  let maxYear = data[0]['year']
  let minYear = data[0]['year']
  data.forEach(element => {
    if (element['year'] > maxYear) {maxYear = element['year']}
    if (element['year'] < minYear) {minYear = element['year']}
  })
  return [minYear, maxYear]
}

function arrayRange(start, stop) {
  const array = []
  for (let i = start; i < (stop+ 1); i++){
    array.push(i)
  }
  return array
}

function YearlyArray(distancesByYear, minYear, maxYear) {
  const YearlyDataArray = []
  console.log(distancesByYear)
  for (let year = minYear; year < (maxYear + 1); year++) {
    console.log(year)
    if (distancesByYear.hasOwnProperty(year)) {
      YearlyDataArray.push(distancesByYear[year])
    } else {
      YearlyDataArray.push(0)
    }
  }
  return YearlyDataArray
}

function generateChartData(distanceByActivityAndYear) {
  const groupedByActivityData = groupByActivity(distanceByActivityAndYear)
  const activities = Object.keys(groupedByActivityData)
  const datasets = []
  const [minYear, maxYear] = minMax(distanceByActivityAndYear)
  console.log(groupedByActivityData)
  console.log(activities)
  activities.sort().forEach((activity)=> {
    // Object keys returns an array of the object's key, that is to say all the activities, which we then sort alphabetically and iterate through
    datasets.push({
      label: activity,
      data: YearlyArray(groupedByActivityData[activity], minYear, maxYear),
      borderWidth: 1,
      stack: 'Activities'
    })
  })
  return {labels: arrayRange(minYear, maxYear), datasets: datasets};
}


function createBarChart(chartCanvas, data) {
  new Chart(chartCanvas, {
    type: 'bar',
    data: generateChartData(data),
    options: {
      plugins: {
        title: {
          display: true,
          text: 'Total Distances by Activity Types'
        },
      },
      responsive: true,
      interaction: {
        intersect: false,
        mode: 'myCustomMode'
      },
      scales: {
        x: {
          stacked: true,
        },
        y: {
          stacked: true
        }
      }
    }
  });
}
