import { Controller } from "@hotwired/stimulus"
import JSZip from 'jszip';
import * as Chartjs from "chart.js";

// We mapped google maps activities to CO2 emission coefficients given by the ADEME
// The ADEME is the french public institution for Carbon footprint monitoring
// Their carbon footprint calculator :   https://datagir.ademe.fr/apps/mon-impact-transport/
// Also here is the API to collect this data: https://github.com/incubateur-ademe/monimpacttransport
const kgCO2PerKmPerActivity = {
  "IN_PASSENGER_VEHICLE": 0.193, //We consider that IN_PASSENGER_VEHICLE is equivalennt to a thermic car
  "MOTORCYCLING": 0.168,
  "FLYING": 0.23,
  "IN_BUS": 0.103, // this is the coefficient for thermic buses
  "IN_TRAIN": 0.0041, // this coefficient correspond to the emissions of an RER or Transilien (suburban parisian train)
  "IN_TRAM": 0.0022,
  "IN_SUBWAY": 0.0025,
  "KAYAKING": 0,
  "IN_FERRY": 0.3,
  "BOATING": 0.3,
  "RUNNING": 0,
  "SAILING": 0,
  "WALKING": 0,
  "CYCLING": 0,
  "UNKNOWN_ACTIVITY_TYPE": 0,
}

export default class extends Controller {
  static targets = ['file','chart','table','tableHeaderRow','tableBody']

  connect() {
  }

  fileLoaded(event) {
    // Load Takeout file
    event.preventDefault()
    const zipfile = this.fileTarget.files[0]
    // getZipped
    getZippedData(zipfile).then(compiledData => {
      console.log(compiledData)
      // console.log(kgCO2PerKmPerActivity)
      const kgCO2EmissionsByActivityAndYear = groupAndSumByProperties(compiledData, ["activity", "year"], "kgCO2")
      // console.log('CO2EmissionsByActivityAndYear', kgCO2EmissionsByActivityAndYear)
      this.chart = createBarChart(this.chartTarget, kgCO2EmissionsByActivityAndYear)
      const columns = ["distance","confidence"]
      columns.forEach(column => {
        this.tableHeaderRowTarget.innerHTML += `<th scope='col' class='text-sm font-medium text-gray-900 px-6 py-4 text-left'>${column}</th>`
        console.log(this.tableHeaderRowTarget)
      })
      let index = 1;
      while(index <= compiledData.length && index < 10) {
        let textToInsert = "";
        columns.forEach(column => textToInsert +=`<td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${compiledData[index][column]}</td>`)
        index ++
        this.tableBodyTarget.insertAdjacentHTML('beforeend',`<tr class="bg-gray-100 border-b" data-upload-target="tableRow">${textToInsert}</tr>`)
      }
      console.log(this.tableBodyTarget)
    });

  }

  clickHandler(evt) {
    const points = this.chart.getElementsAtEventForMode(evt, 'nearest', { intersect: true }, true);
    if (points.length) {
        const firstPoint = points[0];
        const year = this.chart.data.labels[firstPoint.index];
        const activity = this.chart.data.datasets[firstPoint.datasetIndex].label;
      }
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
          // if filename has the right structure (meaning it fits the regex)
          var matches = filepath.match(regex)
          var year = parseInt(matches[1])
          var month = matches[2]
          promises.push(zipentry.async('string').then((filedata) => {
            filedata = JSON.parse(filedata)
            const data = filedata.timelineObjects.reduce((acc, history_item) => {
              if (('activitySegment' in history_item) && !(typeof(history_item.activitySegment.distance)==='undefined')) {
                acc.push({
                    year: year,
                    month: month,
                    confidence: history_item.activitySegment.confidence,
                    activity: history_item.activitySegment.activityType,
                    distance: history_item.activitySegment.distance,
                    kgCO2: history_item.activitySegment.distance/1000 * kgCO2PerKmPerActivity[history_item.activitySegment.activityType],
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
        [sumProperty]: obj[sumProperty],
        data:  [obj]
      };
    } else {
      acc[key][sumProperty] += obj[sumProperty];
      acc[key]['data'].push(obj)
    }

    return acc;
  }, {});
  const result = Object.values(groupedSum);
  return result;
}

function groupByActivity(data){
  // groupByActivity returns an object where each key is an activitype (ie FLYING, WALKING).
  // That key is associated with a value : an array containing all total yearly CO2 Emissions records for this activity
  return data.reduce((acc, cur) => {
    acc[cur['activity']] = acc[cur['activity']] || {}; // if the key is new, initiate its value to an object, otherwise keep its value
    acc[cur['activity']][cur['year']] = cur['kgCO2'];
    return acc;
  }, {})
}

function minMax(dataArray, property){
  // Returns the minimum and maximum property value in an array containing objects who all have this property

  // initialize the maxYear and minYear with the first element of the dataset
  let maxYear = dataArray[0][property]
  let minYear = dataArray[0][property]
  dataArray.forEach(element => {
    if (element[property] > maxYear) {maxYear = element[property]}
    if (element[property] < minYear) {minYear = element[property]}
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

function yearlyCO2EmissionsTons(kgCO2EmissionsByYear, minYear, maxYear) {
  const YearlyDataArray = []
  for (let year = minYear; year < (maxYear + 1); year++) {
    if (kgCO2EmissionsByYear.hasOwnProperty(year)) {
      YearlyDataArray.push(Math.floor(kgCO2EmissionsByYear[year]))
    } else {
      YearlyDataArray.push(0)
    }
  }
  return YearlyDataArray
}

function generateChartData(kgCO2EmissionsByActivityAndYear) {
  // groupByActivity returns an object with each key is the activityType and the value is an array of all the yearly CO2 Emissions totals
  const groupedByActivityData = groupByActivity(kgCO2EmissionsByActivityAndYear)
  console.log(groupedByActivityData)
  const activities = Object.keys(groupedByActivityData)
  const datasets = []

  // get the minimum and maximum years of the grouped CO2 emissions
  const [minYear, maxYear] = minMax(kgCO2EmissionsByActivityAndYear, 'year')

  activities.sort().forEach((activity)=> {
    // Object keys returns an array of the object's key, that is to say all the activities, which we then sort alphabetically and iterate through
    datasets.push({
      label: activity,
      data: yearlyCO2EmissionsTons(groupedByActivityData[activity], minYear, maxYear),
      borderWidth: 1,
      stack: 'Activities'
    })
  })
  console.log(datasets)
  return {labels: arrayRange(minYear, maxYear), datasets: datasets};
}

function createBarChart(chartCanvas, data) {
  return new Chart(chartCanvas, {
    type: 'bar',
    data: generateChartData(data),
    options: {
      plugins: {
        title: {
          display: true,
          text: 'CO2 emissions (kg) by Activity Types'
        },
      },
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        intersect: false,
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

function createTable(data, columns, numberOfItems){

}
