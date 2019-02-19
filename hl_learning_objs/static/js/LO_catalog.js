/*
    object to represent a learning objective based off of catalog data
*/
function Learning_obj(level, verb, condition, task, degree, outcomes){

    // error checking
    if(!(!!level && typeof(level) == "string" && !isNaN(parseInt(level)))) throw Error("Learning Objective: level must be an integer string")
    if(!(!!verb && typeof(verb) == "string" && !isNaN(parseInt(verb)))) throw Error("Learning Objective: verb must be an integer string")
    if(!(!!task && typeof(task) == "string")) throw Error("Learning Objective: task must be a string")

    if(!(!!outcomes && Array.isArray(outcomes))) throw Error("Learning Objective: outcomes must be an array of integer string id's")

    // optional fields
    if(!(typeof(condition) == "string")) throw Error("Learning Objective: condition must be a string")
    if(!(typeof(degree) == "string")) throw Error("Learning Objective: degree must be a string")

    // catalog id's for learning level/verb
    this.level = level;
    this.verb = verb;

    // strings generated during building of learning objective
    this.condition = condition;
    this.task = task;
    this.degree = degree;

    // list of abet strings
    this.ABET_ids = outcomes;


}
    // method to output learning objective string from stored values
    //  must be provided a catalog for mapping verb/level indices
    Learning_obj.prototype.as_str = function(catalog){
        if(typeof(catalog) == undefined) throw Error("Learning Objective: catalog for string lookup must be provided to 'as_str' method.")

        var obj_string = "{0} {1} {2} {3}".format(
                (!!this.condition)? this.condition.concat(','): this.condition,
                "the student will be able to {0}".format(catalog.get_verb(this.level,this.verb)),
                this.task,
                this.degree
            )

        // remove excess spaces if condition/degree aren't provided.
        obj_string = obj_string.trim();

        // punctuation
        obj_string = obj_string.charAt(0).toUpperCase() + obj_string.slice(1).concat('.');

        return obj_string;
    }

    // method to output a json object representing the learning objective
    Learning_obj.prototype.as_raw_obj = function(){
        return {
            'condition': this.condition,
            'level': this.level,
            'verb': this.verb,
            'task': this.task,
            'degree': this.degree,
            "ABET_ids": this.ABET_ids,
        }
    }

    Learning_obj.prototype.outcomes = function(){
        return null;
    }



/*
    Learning Objective LO_catalog
        object containing the structure of learning objectives
        mapping the learning level to its definition/verbs
        and providing a listing of ABET outcomes
*/

function LO_catalog(target, initial_catalog, edit_mode){

    // target can either be a string or a jquery object
    this._target = target;

    this._edit_mode = (typeof(edit_mode) != 'undefined') ? edit_mode: false;

    // add loaded data to catalog from passed initial_catalog
    this.data = initial_catalog.levels;
    this.ABET_outcomes = initial_catalog.ABET;

    // define catalog's record constructor
    this.record = Learning_obj;

    // the existing items generated by the catalog
    //  this list will be used to store generated learning objectives
    this._records = [];

}


    LO_catalog.prototype._generate_ABET_selection = function(){
        // generate a wrapper for the checkbox listing of the
        //  available ABET_outcomes
        var wrapper = $('<div />', {
            class:"ABET_selection_wrapper",
        });

        // for each of the abet outcomes generate a checkable entry
        // and append to the wrapper.
        $.each(this.ABET_outcomes, function(i,outcome){
            var option = $("<label />", {
                "class": "ABET_Label",
                "text": outcome,

            }).prepend($("<input />", {
                "class": "ABET_input",
                "type": "checkbox",
                "value": i,

            }));

            wrapper.append(option);
        })

        // return the listing element
        return wrapper;
    }

    LO_catalog.prototype._generate_level_selection = function(){
        var self = this;
        //  generate a select box listing the possible learning levels
        var wrapper = $('<div />', {
            class:"learning_level_wrapper",
        });

        var selection_label = $('<label />', {
            for: 'learning_level_selection',
            class: 'learning_level_label',
            text: 'Learning Level: '
        });

        var selection = $('<select />', {
            id:"learning_level_selection",
            class:"learning_level_selection",
        });

        wrapper.append(selection_label, selection);

        // create a default 'null' option for the selection
        selection.append($('<option />', {
                class:"learning_level_option",
                value: "None",
                text: "Select Level...",
            })
        );

        $.each(self.data, function(key, value){
            var option = $('<option />', {
                class:"learning_level_option",
                value: key,
                text: value.display_name,
            });

            selection.append(option);

            // generate child verb listings for each levels
            wrapper.append(self._generate_verb_selection(key));
        })

        // bind event to selection change to show/hide verb selections
        $(selection).change(self.learning_level_change_evt);

        return wrapper;
    }

    LO_catalog.prototype._generate_verb_selection = function(level_id){

        // ensure the level_id is accounted for in catalog data
        if(typeof(this.data[level_id]) == "undefined") throw Error("the requested 'level_id' isn't present in the data catalog!");
        if(typeof(this.data[level_id].verbs) == "undefined") throw Error("the requested 'level_id' object doesn't contain any predefined verbs!");

        var separator = $('<i />',{
            class: "fa fa-arrow-right learning_verb_separator",
        });

        var verb_id = "verbs_select_{0}".format(level_id);
        var selection_label = $('<label />', {
            for: verb_id,
            class: 'learning_verb_label',
            text: 'Action: '
        });

        // genearte a select box listing the possible verbs for a specified learning level
        var selection = $('<select />', {
            id: verb_id,
            class:"learning_verb_selection",
            "data-level": level_id,

        });

        // create a default 'null' option for the selection
        selection.append($('<option />', {
                class:"verb_option",
                value: "None",
                text: "Select Action...",
            })
        );

        $.each(this.data[level_id].verbs, function(id, value){
            var option = $("<option />", {
                class: 'verb_option',
                value: id,
                text: value,
            });

            selection.append(option);
        });



        return $('<div />', {
            class: 'verb_selection_wrapper',
            "data-level": level_id,
        }).append(separator, selection_label, selection);
    }

    LO_catalog.prototype.learning_level_change_evt = function(){

        var wrapper = $(this).closest('.learning_level_wrapper')
        var val = $(this).val();

        wrapper.find('.verb_selection_wrapper').removeClass('active');
        wrapper.find('.learning_verb_selection').removeClass('active');
        wrapper.find('.learning_verb_selection').val("None");



        var associated_verb_select = wrapper.find('.learning_verb_selection[data-level={0}]'.format(val))
        associated_verb_select.addClass('active')
        associated_verb_select.closest('.verb_selection_wrapper').addClass('active');


    }

    LO_catalog.prototype.get_level = function(id){

        // check that the provided id is in the catalog's list of data
        if(!(!!id && typeof(this.data[id]) != "undefined")) throw Error("Learning Objective Catalog: Learning Level matching the provided id does not exist!")

        // if passed validation return the level object
        return this.data[id];
    }

    LO_catalog.prototype.get_verb = function(level_id, verb_id){
        var level = this.get_level(level_id);

        // check that a verb id was passed and that it's a valid index for this level's verb list
        if(!(!!verb_id && !isNaN(parseInt(verb_id)) && typeof(level.verbs[parseInt(verb_id)]) != "undefined"))
            throw Error("Learning Objective Catalog: the specified learning level doesn't contain verb at index '{0}' matching the provided id does not exist!".format(verb_id));

        return level.verbs[parseInt(verb_id)];

    }

    LO_catalog.prototype.objective_str = function(level_id,verb_id, condition, task, degree){
        //return "{0} {1} {2} {3}".format(condition, this.data[level_id].get_verb(verb_id), task, degree);
        throw Error('non implemented')
    }

    LO_catalog.prototype.list_outcomes = function(outcome_ids){
        // create a wrapper for the listing
        var wrapper = $('<div />',{
            class: "ABET_listing_wrapper",
        });
        // create the listing object
        var listing = $('<ul />', {
            class: "ABET_listing"
        })

        // append listing to wrapper
        wrapper.append(listing);

        // for each specified outcome id in the listing
        // generate a list item and append it to the listing
        $.each(outcome_ids, function(i, value){
            var outcome = $('<li />', {
                class: "ABET_outcome",
                text: value,
            });

            listing.append(outcome)
        });

        return wrapper;

    }

    LO_catalog.prototype.num_records = function(){
        return this._records.length;
    }

    LO_catalog.prototype.add_record = function(new_learning_obj){
        if(!(new_learning_obj instanceof this.record)) throw Error('Catalog only accepts Learning_obj objects')

        this._records.push(new_learning_obj);
    }

    LO_catalog.prototype.remove_record = function(item_index){
        // remove the item at the passed index;
        this._records.splice(item_index,1);
    }

    // import the json list conatining existing learning objectives
    LO_catalog.prototype.import_records = function(obj_list){
        var self = this;

        $.each(obj_list, function(i, item){
            var new_item = new self.record(
                    item.level,
                    item.verb,
                    item.condition,
                    item.task,
                    item.degree,
                    item.ABET_ids
                );
            self.add_record(new_item);
        });



    }

    // export the current colleciton of learning objectives as a json obj list
    LO_catalog.prototype.export_records = function(){
        return this._records;
    }

    // generate displayable elements for records
    LO_catalog.prototype._records_as_html = function(){

        var wrapper = $('<div />',{
            class: 'record_listing_wrapper',
        });

        var listing = $('<ol />', {
            class: 'record_listing',
        });

        // generate the listing based on the stored records
        //  otherwise output a single list item stating an 'empty' message
        if(this.num_records() > 0){
            var catalog = this;

            $.each(this._records, function(i, record){

                var record_string = record.as_str(catalog);
                var row = $('<li />', {
                    class: 'record_item',
                    text: record_string,
                })
                listing.append(row);

            });
        }else {

            var row = $('<li />', {
                class: 'record_item',
                text: 'There don\'t appear to be any Learning Objectives',
            })
            listing.append(row);
        }

        wrapper.append(listing);


        return wrapper;
    }

    // generate editable elements for records
    LO_catalog.prototype._editable_records_as_html = function(){

        var wrapper = $('<div />',{
            class: 'record_listing_wrapper',
        });

        var listing = $('<div />', {
            class: 'record_listing editable',
        });

        // generate the listing based on the stored records
        //  otherwise output a single list item stating an 'empty' message
        if(this.num_records() > 0){
            var catalog = this;

            $.each(this._records, function(i, record){

                var row = $('<div />', {
                    class: 'record_item editable',
                    "data-record-index": i,
                })

                var record_string = record.as_str(catalog);
                var display_str = $('<div />', {
                    class: 'display_cell',
                    text: record_string,
                })

                var controls = $('<div />', {
                    class: 'controls',
                })

                var edit_btn = $('<i />', {class: 'fa fa-edit edit_btn control'})
                var delete_btn = $('<i />', {class: 'fa fa-trash delete_btn control'})

                controls.append(edit_btn);
                controls.append(delete_btn);
                //controls.append($('<i />', {class: 'fa fa-arrows move_btn control'}))

                // map delete events
                delete_btn.click(function(){
                    var index = $(this).closest('.record_item').attr('data-record-index')
                    catalog.remove_record(index);
                    catalog.update_listing();
                })


                row.append(display_str, controls);

                listing.append(row);

            });
        }else {

            var row = $('<div />', {
                class: 'record_item',
                text: 'There don\'t appear to be any Learning Objectives',
            })
            listing.append(row);
        }

        // add the listing and add new button to the wrapper
        wrapper.append(listing);



        var catalog = this;
        // enable sortability controlls
        $(listing).sortable({
            handle:'.display_cell',
            placeholder: "ui-state-highlight",
            start: function(e, ui){
                ui.placeholder.height(ui.item.height());
                ui.placeholder.width(ui.item.width());
            },
            stop: function(e,ui){
                // after sorting update catalog record collection
                // to reflect changes
                catalog.update_record_order();
            }
        });
        $(listing).disableSelection();

        return wrapper;
    }

    LO_catalog.prototype._ABETs_set_as_html = function(){

        var abets = [];
        // get all abet id's in the records
        $.each(this._records, function(i, elem){
            abets.concat(this.ABET_ids);
        });

        // refine set to unique elements
        abets = abets.filter(function (value, index, self) {
            return self.indexOf(value) === index;
        });

        // sort the unique indexes
        abets.sort()

        debugger;
        // generate listing of unique/ordered abets
        var wrapper = $('<ul />', {
            class: 'ABET_listing'
        })

        var catalog = this;
        $.each(abets, function(i, value){
            wrapper.append($('<li />', {
                class: "abet_item",
                text: catalog.ABET_outcomes[value]
            }))
        })


        return wrapper;


    }
    // reorder the records of the list to match display
    //      new_order is the current display ordering of the indices
    LO_catalog.prototype._update_record_indices = function(new_order){

        var catalog = this;
        // construct a newly ordered collection of records
        var ordered_records = []
        $.each(new_order, function(new_position, old_position){
            ordered_records.push(catalog._records[old_position]);
        });

        // if there are any additional records not accounted for in new_order,
        //  add them to the end of the array (new-items get added to end anyway)
        this._records = ordered_records.concat(this._records.slice(ordered_records.length))


    }

    LO_catalog.prototype.update_record_order = function(){

        // get an array of initial indexes ordered by current position
        var current_display_order = $(".record_item", this._target).map( function(){
            return $(this).attr('data-record-index');
        }).toArray();

        this._update_record_indices(current_display_order);

        // reindex the initial order attributes to reflect sorted status
        $.each( $(".record_item", this._target), function(i, element){
            $(this).attr('data-record-index',i);
        });

    }

    LO_catalog.prototype.update_listing = function(){

        $(this._target).html('');

        if(this._edit_mode){
            $(this._target).append(this._editable_records_as_html());

        }else {
            $(this._target).append(this._records_as_html());
            
            $(this._target).append(this._ABETs_set_as_html());


        }

    }
