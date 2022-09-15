# kaso-logger

## log statement:

```
logger.level({ message: '', ...loggedObjects: any[], meta: {}, ResourceName: '' });
```

## log levels:

1. **debug**: for debugging use only (env vriable DEBUG_SWITCH: ['on','off'])
2. **error**: on expected errors
3. **info**: general logs
4. **crit**: on system errors or unexpected behaviors
5. **http**: for any integration request or response
6. **warn**: warning scenarios.
7. **verbose**: for database and redis queries.
- log levels can be mixed dpeninding on the log scenario
- **debug** level is used for more detailed logging in cases where detailed flow must be observed 

## log messages:
1. Build Meaning and Context into Log Messages
2. every log message should be unique
3. Avoid Logging Non-essential or Sensitive Data

##  logged Objects:
1. object should'nt be too big to cause performance issues
2. object should'nt be too small to cause missing flows and cases

## log meta:
1. add any meta data to filtered on in datadog dashboard
2. add general meta tags to filter on group of logs

## what to log/report to sentry? 
- you can log:
1. function entries as debug
2. complex queries
3. error and warn cases
4. critical requsest & response
you can report to sentry what logs cannot reveal or any error that must be highlited or throw a notification upon happening
**ex**:  thrid party is down, intense processing errors that might introuduce too many database connections


## what is an expected and managed error?
- expected or managed error is any error that:
1. is descriped as a wrong scenario in the flow of logic.
2. is handled close to where they happen
3. can be given a proper corresponding error message.

## what is an unexpected error?
- unexpected error is any error that:
1. error that can't be covered in the flow of logic , test cases nor user stories.
2. is handled in a try catch block
3. error is captured without knowing a proper message that can be given to the error
