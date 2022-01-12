/*
 * Copyright 2022 Ashutosh Sundresh. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License").
 * You may not use this file except in compliance with the License.
 * A copy of the License is located at
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * or in the "license" file accompanying this file. This file is distributed
 * on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either
 * express or implied. See the License for the specific language governing
 * permissions and limitations under the License.
 */
const Alexa = require('ask-sdk-core');
const moment = require("moment-timezone");
const axios = require("axios");
const appName = "Shiv Nadar School Faridabad Food Menu";

// Link to the json on GitHub that hosts the menu
const menuApiUrl = 'https://raw.githubusercontent.com/AshutoshSundresh/SoulfairProject/main/menu.json';

const LaunchRequestHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'LaunchRequest';
    },
    handle(handlerInput) {
        const speakOutput = 'Welcome to Shiv Nadar Faridabad Food menu, which meal and day would you like to know?';

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            .getResponse();
    }
};

const MealIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest' &&
            Alexa.getIntentName(handlerInput.requestEnvelope) === 'MealIntent';
    },
    async handle(handlerInput) {
        // hardcode to Kolkata timezone for India only 
        let userTimeZone = "Asia/Kolkata";

        // getSlotValue takes a slot from the voice interaction model
        // "all" is one of the values of meal, which returns both breakfast and lunch
        const meal = Alexa.getSlotValue(handlerInput.requestEnvelope, "meal") || "all";
        const mealType = meal === "all" ? "all" : handlerInput.requestEnvelope.request.intent.slots.meal.resolutions.resolutionsPerAuthority[0].values[0].value.name;

        // Set the current time
        const localNowMoment = moment().tz(userTimeZone);
        // Format to Amazon's preferred date style
        const todayDate = localNowMoment.format("YYYY-MM-DD");
        // Use Amazon.DATE slot
        let date = Alexa.getSlotValue(handlerInput.requestEnvelope, "date") || todayDate; // Default to today's date

        const day = moment(date).tz(userTimeZone, true).calendar(localNowMoment, {
            sameDay: "[today]",
            nextDay: "[tomorrow]",
            nextWeek: "[on] dddd, MMMM Do",
            lastDay: "[yesterday]",
            lastWeek: "[last] dddd, MMMM Do",
            sameElse: "[on] dddd, MMMM Do YYYY" // Do = 5th, etc.
        });

        // if the date requested is greater than the current date, it is future (used to handle future tense)
        let isFutureDate = date > todayDate;
        if (date === todayDate) {
            // obviously breakfast would be over by 10 AM, so use past tense then
            if (mealType === "breakfast" && localNowMoment.hour() < 10)
                isFutureDate = true;
            // similarly lunch would be over by 2 PM, so use past tense then
            else if (mealType === "lunch" && localNowMoment.hour() < 14)
                isFutureDate = true;
        }

        // initialise food variable as an empty string
        let food = "";

        let response;
        let meals;

        try {
            // get the menu json using axios
            response = await axios.get(menuApiUrl);
            // fetch only the meal which the user wants. this is what [date] does, already defined by Alexa.DATE
            meals = response.data[date] || {};
        } catch (error) {
            // catch a possible error for axios
            return handlerInput.responseBuilder.speak(`There was a problem getting the menu for ${date}.`)
                .withShouldEndSession(true)
                .getResponse();
        }

        // define speakOutput variable
        let speakOutput;

        // we want all the meal times now
        if (mealType === "all") {
            // these are defined in the json under each date
            const mealTimeNames = ["breakfast", "lunch"];

            for (let i = 0; i < mealTimeNames.length; i++) {
                // mealTimeName is one of breakfast and lunch
                const mealTimeName = mealTimeNames[i];
                // we've already defined meals previously to be the specific date, so simply grab the food info now
                const mealDescription = meals[mealTimeName];
                // check if info exists first
                if (mealDescription) {
                    // define the food variable, which was previously empty
                    food += `${mealTimeName}: ${mealDescription}.  `;
                }
            }
            // speak out the output based on whether there is food or not
            speakOutput = !food ? `Meals ${day} ${(isFutureDate ? "are" : "were")} not planned.` : `Meals ${day} ${(isFutureDate ? "will be" : "were")} as follows: ${food}.`;
        } else {
            // we don't want both lunch and breakfast here, so fallback to the one needed
            food = meals[mealType];

            speakOutput = !food ? `${mealType} ${day} ${isFutureDate ? "is" : "was"} not planned.` : `${mealType} ${day} ${(isFutureDate ? "will include" : "included")} ${food}.`;
        }

        return handlerInput.responseBuilder
            .speak(speakOutput)
            //.reprompt('add a reprompt if you want to keep the session open for the user to respond')
            .getResponse();
    }
};

const CanFulfillMealIntentRequestHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === "CanFulfillIntentRequest" &&
            handlerInput.requestEnvelope.request.intent.name === "MealIntent";
    },
    handle(handlerInput) {
        const getMealRequest = handlerInput.requestEnvelope.request.intent.slots.getMealRequest;
        const meal = handlerInput.requestEnvelope.request.intent.slots.meal;
        const date = handlerInput.requestEnvelope.request.intent.slots.date;

        const getMealRequestFulfill = !!getMealRequest; // meal request is available
        const mealFulfill = !!meal; // meal is available
        const dateFulfill = !!date; // date is available

        const canFulfill = !!meal // fulfill if only the meal is available
            ||
            (getMealRequestFulfill && getMealRequest.length > 6 && dateFulfill); // fulfill if the getMealRequest is not short and date is available

        return handlerInput.responseBuilder
            .withCanFulfillIntent({
                "canFulfill": canFulfill ? "YES" : "NO",
                "slots": {
                    "getMealRequest": {
                        "canUnderstand": getMealRequestFulfill ? "YES" : "NO",
                        "canFulfill": canFulfill && getMealRequestFulfill ? "YES" : "NO"
                    },
                    "meal": {
                        "canUnderstand": mealFulfill ? "YES" : "NO",
                        "canFulfill": canFulfill && mealFulfill ? "YES" : "NO"
                    },
                    "date": {
                        "canUnderstand": dateFulfill ? "YES" : "NO",
                        "canFulfill": canFulfill && dateFulfill ? "YES" : "NO"
                    },
                }
            })
            .getResponse();
    }
};

const HelpIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest' &&
            Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.HelpIntent';
    },
    handle(handlerInput) {
        const speakOutput = 'How can I help you today?';

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            .getResponse();
    }
};

const CancelAndStopIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest' &&
            (Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.CancelIntent' ||
                Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.StopIntent');
    },
    handle(handlerInput) {
        const speakOutput = 'Goodbye!';

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .getResponse();
    }
};

/* *
 * FallbackIntent triggers when a customer says something that doesn’t map to any intents in your skill
 * It must also be defined in the language model (if the locale supports it)
 * This handler can be safely added but will be ingnored in locales that do not support it yet 
 * */
const FallbackIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest' &&
            Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.FallbackIntent';
    },
    handle(handlerInput) {
        const speakOutput = 'Sorry, I don\'t know about that. Please try again.';

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            .getResponse();
    }
};

/* *
 * SessionEndedRequest notifies that a session was ended. This handler will be triggered when a currently open 
 * session is closed for one of the following reasons: 1) The user says "exit" or "quit". 2) The user does not 
 * respond or says something that does not match an intent defined in your voice model. 3) An error occurs 
 * */
const SessionEndedRequestHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'SessionEndedRequest';
    },
    handle(handlerInput) {
        console.log(`~~~~ Session ended: ${JSON.stringify(handlerInput.requestEnvelope)}`);
        // Any cleanup logic goes here.
        return handlerInput.responseBuilder.getResponse(); // notice we send an empty response
    }
};

/* *
 * The intent reflector is used for interaction model testing and debugging.
 * It will simply repeat the intent the user said. You can create custom handlers for your intents 
 * by defining them above, then also adding them to the request handler chain below 
 * */
const IntentReflectorHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest';
    },
    handle(handlerInput) {
        const intentName = Alexa.getIntentName(handlerInput.requestEnvelope);
        const speakOutput = `You just triggered ${intentName}`;

        return handlerInput.responseBuilder
            .speak(speakOutput)
            //.reprompt('add a reprompt if you want to keep the session open for the user to respond')
            .getResponse();
    }
};

/**
 * Generic error handling to capture any syntax or routing errors. If you receive an error
 * stating the request handler chain is not found, you have not implemented a handler for
 * the intent being invoked or included it in the skill builder below 
 * */
const ErrorHandler = {
    canHandle() {
        return true;
    },
    handle(handlerInput, error) {
        const speakOutput = 'Sorry, I had trouble doing what you asked. Please try again.';
        console.log(`~~~~ Error handled: ${JSON.stringify(error)}`);

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            .getResponse();
    }
};

/**
 * This handler acts as the entry point for your skill, routing all request and response
 * payloads to the handlers above. Make sure any new handlers or interceptors you've
 * defined are included below. The order matters - they're processed top to bottom 
 * */
exports.handler = Alexa.SkillBuilders.custom()
    .addRequestHandlers(
        LaunchRequestHandler,
        MealIntentHandler,
        CanFulfillMealIntentRequestHandler,
        HelpIntentHandler,
        CancelAndStopIntentHandler,
        FallbackIntentHandler,
        SessionEndedRequestHandler,
        IntentReflectorHandler
    )
    .addErrorHandlers(
        ErrorHandler
    )
    .lambda();
