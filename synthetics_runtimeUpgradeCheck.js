const axios = require('axios');
const fs = require('fs');
const { Parser } = require('json2csv');
const arg = process.argv.slice(2);
var cursor = '';

//Checking if the API Key has been provided as a command-line argument. If not, the program exits.
if (arg.length < 1) {
    console.error("API Key not provided");
    console.error("Please use the format \"node synthetics_runtimeUpgradeCheck.js NRAK********\"");
    process.exit(1);
}

const API_KEY = arg[0];
const NERDGRAPH_URL = 'https://api.newrelic.com/graphql';
var upgradeStatusArray = [];


async function getSyntheticsRuntimeUpgradeStatus(cursor) {
    const validationStatusQuery = `{
  actor {
    entitySearch(query: "domain = 'SYNTH' AND type = 'RUNTIME_VALIDATION'") {
      results ${cursor}{
        nextCursor
        entities {
          guid
          name
          tags {
            key
            values
          }
          account {
            name
            id
          }
        }
      }
    }
  }
}`

    console.log("Running Nerdgraph API!");
    const response = await callNerdgraphAPI(validationStatusQuery);
    const entities = response.data.actor.entitySearch.results.entities;
    console.log("Getting Synthetic Monitor Success Rate for last 1 week!")
    // console.log(entities);
    for (const entity of entities) {
        var monitorName = entity.name;
        // var monitorGuid = entity.guid;
        var accountName = entity.account.name;
        var accountId = entity.account.id;
        for (const tag of entity.tags) {
            if (tag.key == 'validationStatus') {
                var validationStatus = tag.values[0];
            }
        }
        var monitorPassPercentage = await getMonitorPassPercentage(monitorName, accountId)
        var monitorObj = {
            'Account Name': accountName,
            'Account ID': accountId,
            'Monitor Name': monitorName,
            // 'Monitor GUID': monitorGuid,
            'Validation Status': validationStatus,
            'Monitor Pass Percentage': monitorPassPercentage
        }
        upgradeStatusArray.push(monitorObj);
    }
    if (response.data.actor.entitySearch.results.nextCursor != null){
        cursor = "(cursor: \"" + response.data.actor.entitySearch.results.nextCursor +"\")"
        await getSyntheticsRuntimeUpgradeStatus(cursor);
    }
    return upgradeStatusArray;
}

async function callNerdgraphAPI(query){
    try {
        var graphql_response = await axios.post(
            NERDGRAPH_URL,
            { query },
            {
                headers: {
                    'Content-type': 'application/json',
                    'API-KEY': API_KEY,
                },
            }
        );
        // console.log(query);
        // console.log(graphql_response);
        return graphql_response.data;
    } catch (error){
        console.error(error);
    }
}

async function getMonitorPassPercentage(name, accountId){
    const passPercentageQuery = `{
  actor {
    nrql(
      accounts: ${accountId}
      query: "From SyntheticCheck SELECT percentage(count(*), WHERE result = 'SUCCESS') SINCE 1 week ago WHERE monitorName = '${name}'"
    ) {
      results
      nrql
    }
  }
}`
    const response = await callNerdgraphAPI(passPercentageQuery);
    // for (const percent of response.data.actor.nrql.results) {
    //     console.log(percent['percentage']);
    // }
    return response.data.actor.nrql.results[0]['percentage'];
}


async function generateRuntimeUpgradeReport(){
    console.log("Getting runtime upgrade status!")
    const runtimeUpgradeValidation = await getSyntheticsRuntimeUpgradeStatus(cursor);
    // console.log(runtimeUpgradeValidation);
    const json2csvParser = new Parser();
    const csv = json2csvParser.parse(runtimeUpgradeValidation);
    console.log("Creating CSV file - runtimeUpgradeValidation.csv!");
    fs.writeFile('runtimeUpgradeValidation.csv', csv, (err) => {
        if (err){
            console.error('Error writing CSV File: ', err);
        } else {
            console.log("CSV file successfully created!")
        }
    });
}
//Program starts here
generateRuntimeUpgradeReport();