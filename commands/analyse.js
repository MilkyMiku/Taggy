const { Command } = require("discord-akairo");
const Pagination = require('discord-paginationembed');
const vision = require('@google-cloud/vision');

class AnalyseCommand extends Command {
    constructor() {
        super("analyse", {
            aliases: ["analyze", "analyse"],
            args: [
                {
                    id: "one",
                    type: "string"
                }
            ]
        });

        this.visionClient = new vision.ImageAnnotatorClient();
    }

    exec(message, args) {

        function checkURL(url) {
            return(url.match(/\.(jpeg|jpg|gif|png)$/) != null);
        }

        if(!checkURL(args.one)) {
            return message.util.send("Please enter an image")
        } 
        const request = {
            image: {source: {imageUri: args.one}},
            features: [
              {type: 'SAFE_SEARCH_DETECTION'},
              {type: 'LABEL_DETECTION'}
            ]
        };
        this.visionClient
        .annotateImage(request)
        .then(response => {
            let result = [];
            console.log("SafeSearch Results\n")
            const safesearch = response[0].safeSearchAnnotation;
            console.log("Adult Content", safesearch.adult);
            result.push(["Adult Content", safesearch.adult]);
            console.log("Drugs", safesearch.medical);
            result.push(["Drugs", safesearch.medical]);
            console.log("Violence", safesearch.violence);
            result.push(["Violenece", safesearch.violence]);
            console.log("\n\n");

            console.log("Label Results\n");
            const labels = response[0].labelAnnotations;
            labels.forEach(label => console.log(label.description + ": " + label.score.toFixed(2)) );
            labels.forEach(label => {
                let description = label.description;
                let score = label.score.toFixed(2) + "%";
                result.push([description, score]);
            })
            
            // return message.util.send("Woohoo")

            const FieldsEmbed = new Pagination.FieldsEmbed()
            // A must: an array to paginate, can be an array of any type
            .setArray(result)
            // Set users who can only interact with the instance, set as `[]` if everyone can interact.
            .setAuthorizedUsers([message.author.id])
            // A must: sets the channel where to send the embed
            .setChannel(message.channel)
            // Elements to show per page. Default: 10 elements per page
            .setElementsPerPage(20)
            // Have a page indicator (shown on message content)
            .setPageIndicator(false)
            // Disable the default emojis
            .setDisabledNavigationEmojis(['DELETE'])
            // Format based on the array, in this case we're formatting the page based on each object's `word` property
            .formatField(`Image Analysis`, result => (`${result[0]}: ${result[1]}`))
            .setDeleteOnTimeout(false);
            // Customise embed
            FieldsEmbed.embed
            .setColor(0x00FFFF)
            .setTitle('ANALYSE')
        
            // Deploy embed
            return FieldsEmbed.build();
            })
        .catch(err => {
            console.error(err);
            return message.util.send("Something fucked up...");
        });
    }
}

module.exports = AnalyseCommand;