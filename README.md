# MealIntent Skill
This is a Node.js code for an Alexa skill that retrieves meal information for a given date and time.

## Functionality
The skill retrieves meal information for a given date and time using a JSON API. The JSON API provides information on meals for a given date, which is parsed and used to generate the output.

## Code
The code consists of a single handler function for the Alexa skill, which is divided into two parts: canHandle and handle.

## canHandle
This function determines whether the input provided by the user is an IntentRequest for the MealIntent. The function returns true if the input is an IntentRequest for the MealIntent and false otherwise.

## handle
This function handles the input provided by the user by retrieving the meal information for the requested date and time.

- First, it sets the user's timezone to "Asia/Kolkata" for India. It then gets the meal requested by the user, which could be either "breakfast", "lunch" or "all" (both meals). It also gets the date requested by the user, which defaults to today's date if no date is specified.

- It then formats the date in Amazon's preferred date style and determines the day of the week (e.g. "today", "tomorrow", "Monday", etc.) based on the user's timezone.

- If the date requested is in the future, the function sets a variable <b>'isFutureDate'</b> to true. If the meal requested is breakfast and the current time is before 10 AM, or if the meal requested is lunch and the current time is before 2 PM, <b>'isFutureDate'</b> is also set to true.

- The function then initializes the <b>'food'</b> variable as an empty string and defines <b>'response'</b> and <b>'meals'</b> variables. It attempts to get the menu for the specified date from an API endpoint using axios. If there is an error, it returns a message saying that there was a problem getting the menu.

- If the meal requested is "all", the function loops through breakfast and lunch and adds their descriptions to the <b>'food'</b> variable. If a description exists for a meal, it adds it to the <b>'food'</b> variable with the meal name. If no descriptions exist, the function sets <b>'speakOutput'</b> to a message saying that no meals were planned for the requested date.

- If the meal requested is either "breakfast" or "lunch", the function sets <b>'food'</b> to the description of the requested meal. If a description exists, the function sets <b>'speakOutput'</b> to a message stating that the meal will/was included in the menu. If no description exists, the function sets <b>'speakOutput'</b> to a message saying that the meal was not planned for the requested date.

- Finally, the function returns a response with <b>'speakOutput'</b> as the spoken message to the user.

## Add to your Alexa
https://www.amazon.in/Shiv-Nadar-School-Faridabad-Food/dp/B09Q2Z1CBW
