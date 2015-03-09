/**
 * Constructor: creates an ExpertList.
 * @param experts Array of experts
 * @constructor
 */
function ExpertList(experts) {
    this.experts = experts;
}

/**
 * Class method to compare experts by country and last name.
 * Used in sorting.
 * @param expert1
 * @param expert2
 * @returns {boolean}
 */
ExpertList.compare = function (expert1, expert2) {
    if (expert1.country > expert2.country) {
        return true;
    }
    else if (expert1.country < expert2.country) {
        return false;
    }
    else if (expert1.last_name > expert2.last_name) {
        return true;
    }
    else {
        return false
    }
}

/**
 * Sorts the List's experts array, using the compare class function of ExpertList.
 */
ExpertList.prototype.sort = function() {
    this.experts.sort( ExpertList.compare )
};

/**
 * Returns a new expert list that contains only experts of the given country.
 * The original expertList is not changed!
 * @param country
 * @returns {ExpertList} A new ExpertList that contains only the filtered experts
 */
ExpertList.prototype.filterByCountry = function(country) {
    var filtered = this.experts.filter(function(expert) {
        return expert.country == country;
    });
    var filteredExperts = new ExpertList( filtered );
    return filteredExperts;
};

/**
 * Returns a new expert list that contains only experts with the given experience(s).
 * The original expertList is not changed!
 * @param desired_experiences Array of experiences by which to filter
 * @returns {ExpertList} A new ExpertList that contains only the filtered experts
 */
ExpertList.prototype.filterByExperiences = function(desired_experiences) {
    var filtered = this.experts.filter(function(expert) {
        var matching_experiences = _.intersection(expert.experiences, desired_experiences);
        // This is an OR selection:
        // return matching_experiences.length > 0;
        // ...but we want AND:
        // all of the desired_experiences must be IN the matching_experiences:
        return matching_experiences.length == desired_experiences.length;
    });
    var filteredExperts = new ExpertList( filtered );
    return filteredExperts;
};
