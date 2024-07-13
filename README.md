# Synthetics_RuntimeUpgradeCheck
Script to check runtime upgrade status of synthetic monitors running on legacy runtime  


This script uses the New Relic NerdgraphAPI to check status of the runtime upgrade validation check for synthetic monitors running on legacy synthetic runtimes.   
Along with performing the validation, the script also checks the success rate of all the tested monitors for 1 week.  
This allows the user to identify synthetic monitors that have been consistently failing, so that these monitors can be assessed and disabled if they are not required any more.  
This script iis written in nodejs and can be executed as below 

1. Install all the dependency package using the npm install command
```npm install```

2. Run the script using the command below. Make sure to provide the User API Key in the command line. 

```node synthetics_runtimeUpgradeCheck.js <API-Key>```  

Successful script execution generates an output csv file - runtimeUpgradeValidation.csv - that highlights the monitor name, account name, validation status and success rate since last 1 week.  
The success rate of the monitor can be used to assess the validity of the script, and disable if required.

