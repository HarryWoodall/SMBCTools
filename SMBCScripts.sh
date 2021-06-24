IS_NUMERIC='^[0-9]+$';
REFERENCE_COLOR='\e[33m';
STATUS_COLOR='\e[94m';
BOLD='\e[1m';
PARAM_COLOR='\e[91m';
COMMAND_COLOR='\e[95m';
MODIFIER_COLOR='\e[92m';
PRIORITY_COLOR='\e[94m';
WARNING_COLOR='\e[33m';
HIGH_PRIORITY='\e[91m';
MED_PRIORITY='\e[33m';
LOW_PRIORITY='\e[92m';
NC='\e[0m';

NODE_COMMAND="node --no-warnings $SMBC_TOOLS/Node_Resources/index.js $SMBC_TOOLS"

function smbcinit {
    npm i $SMBC_TOOLS/Node_Resources;
}

function trivia() {
    ARGS="";
    for ELEMENT in "$@"; do
        ARGS+=" \"${ELEMENT}\""
    done
    $NODE_COMMAND 'trivia' $ARGS;
}

function jira() { 
    fileName="$SMBC_TOOLS/Resources/Jira.txt";

    if [ "$#" == 0 ]; then
        start chrome "https://stockportbi.atlassian.net/browse/";

    elif [[ $1 =~ $IS_NUMERIC ]]; then
        start chrome "https://stockportbi.atlassian.net/browse/DIGITAL-$1";

    else
        ARGS="";
        for ELEMENT in "$@"; do
            ARGS+=" \"${ELEMENT}\""
        done
        $NODE_COMMAND 'jira' $ARGS;
    fi 
}

function model() {
    ARGS="";
    for ELEMENT in "$@"; do
        ARGS+=" \"${ELEMENT}\""
    done
    $NODE_COMMAND 'createModel' $ARGS $WORK_DIR;
}

function validate() {
    ARGS="";
    for ELEMENT in "$@"; do
        ARGS+=" \"${ELEMENT}\""
    done
    $NODE_COMMAND 'validateJson' $ARGS $WORK_DIR;
}

function slugs() {
    ARGS="";
    for ELEMENT in "$@"; do
        ARGS+=" \"${ELEMENT}\""
    done
    $NODE_COMMAND 'slugs' $ARGS $WORK_DIR;
}

function flow() {
    ARGS="";
    for ELEMENT in "$@"; do
        ARGS+=" \"${ELEMENT}\""
    done
    $NODE_COMMAND 'flow' $ARGS $WORK_DIR;
}

function addjson() {
    if [ "$1" == "help" ]; then
        printf "

    addjson ${COMMAND_COLOR}-file${NC} <${PARAM_COLOR}file name${NC}>

        Copy a file from form-builder-json to form-builder

        File name can have file type suffex ommited as it is assumed that all 
        files are of type .json

    addjson <${MODIFIER_COLOR}?modifier...${NC}>

        addjson updates non UI files in your DSL folder in form builder to match your 
        V2 folder in form builder json.
        This will only modify files in DSL, keeping a single point of truth.
        Files that exist in v2 but not in DSL will not be copied over.

            ${MODIFIER_COLOR}-p${NC} -- Will perform a fresh pull of form-builder-json before copying files.
            
            ${MODIFIER_COLOR}-e${NC} -- Will also copy the 'Elements' folder

            ${MODIFIER_COLOR}-l${NC} -- Will also copy the 'Lookups' folder

            ${MODIFIER_COLOR}-f${NC} -- Will set all AddressProviders and StreetProviders to fake inside the DSL 
                  after copy has completed

        Updates will only be made if files in DSL and v2 are different.
        Multiple parameters can be used in a single command, and in any order.

        ${WARNING_COLOR}WARNING${NC}: This command will overide any changes made to non UI files made in DSL.

        ${WARNING_COLOR}WARNING${NC}: arguments will execute in the order they were  given, so having the 
        ${MODIFIER_COLOR}-p${NC} argument after an ${MODIFIER_COLOR}-l${NC} or ${MODIFIER_COLOR}-e${NC} will not result in those folders being updated 
        befored copied over.
            ";
        return;
    fi

    fakeAddress=0;
    for arg in "$@"
    do
        # Appending -p It will pull form-builder-json from github
        if [ $arg == "-p" ]; then
            echo "Updating files..."
            cd $WORK_DIR/form-builder-json;
            git pull;
        fi

        if [ $arg == "-e" ]; then
            __updateElements;
        fi

        if [ $arg == "-l" ]; then
            __updateLookups;
        fi

        # Appending -f will set all AddressProviders to fake 
        if [ $arg == "-f" ]; then
            fakeAddress=1;
        fi
    done

    if [ "$1" == "-file" ]; then
        if [[ ! "$2" =~ .*".json"$ ]]; then
            cpyFile="${2}.json";
        else
            cpyFile="${2}"
        fi

        if [ -f "$WORK_DIR/form-builder/src/DSL/$cpyFile" ]; then
            echo "$cpyFile is already in form-builder";
            return 1;
        fi

        if [ -f "$WORK_DIR/form-builder-json/v2/$cpyFile" ]; then
            echo "Copying $cpyFile over to form-builder";
            cp $WORK_DIR/form-builder-json/v2/$cpyFile $WORK_DIR/form-builder/src/DSL/$cpyFile;
            echo "Copied Successfully";
            return 0;
        fi

        echo "ERROR: Could not find $2 in form-builer-json";
        return 1;
    fi

    echo "Comparing files in form builder...";
    if [ ! -f "$SMBC_TOOLS/Resources/lastJsonUpdate.txt" ]; then
       echo "0" > $SMBC_TOOLS/Resources/lastJsonUpdate.txt;
    fi
    LAST_RUN=$(cat "$SMBC_TOOLS/Resources/lastJsonUpdate.txt");

    # Iterate over non UI files in form-builder and update any that are different
    find $WORK_DIR/form-builder/src/DSL/ -maxdepth 1 -not -name *UI-* -type f | while read fbname; do
        NAME=$(basename $fbname);
        fbjname=$WORK_DIR/form-builder-json/v2/$NAME;
        if [ -f "$fbjname" ] && [ $(date -r "$fbjname" '+%s') -gt $LAST_RUN ]; then
        # find $WORK_DIR/form-builder-json/v2 -maxdepth 1 -name $NAME -type f | while read fbjname; do
            flag=0;
            if [ "! cmp -s $fbname $fbjname" ]; then
                # Copy the file
                echo "Copying $(basename $fbjname) over to form-builder"; 
                cp $fbjname $fbname; 
                
                # Change the address provider so it can run locally.
                if [ $fakeAddress == 1 ]; then
                    if grep -q -e '"AddressProvider": "CRM"' $fbname ; then
                        echo "Faking addresses in $NAME";
                        sed -i -e 's/"AddressProvider": "CRM"/"AddressProvider": "Fake"/g' $fbname;
                    fi
                    
                    if grep -q -e '"StreetProvider": "CRM"' $fbname ; then
                        echo "Faking streets in $NAME";
                        sed -i -e 's/"StreetProvider": "CRM"/"StreetProvider": "Fake"/g' $fbname;
                    fi
                fi
            fi
        # done
        fi
    done

    echo $(date '+%s') > "$SMBC_TOOLS/Resources/lastJsonUpdate.txt";

    echo "Done."
}

function formTest() {
    if [ $# == 2 ]; then
        if [ $1 == "int" ]; then
            start chrome "https://int-formbuilder-origin.smbcdigital.net/v2/$2";
        elif [ $1 == "qa" ]; then
            start chrome "https://qa-formbuilder-origin.smbcdigital.net/v2/$2";
        elif [ $1 == "stage" ]; then
            start chrome "https://stage-formbuilder-origin.smbcdigital.net/v2/$2";
        fi
    fi
}

# Private functions

function __updateElements() {
    echo "Updating Elements..."

    find $WORK_DIR/form-builder-json/Elements -maxdepth 1  -type f | while read elementName; do
        NAME=$(basename $elementName);
        fbElementName=$WORK_DIR/form-builder/src/DSL/Elements/$NAME

        if [ -f $WORK_DIR/form-builder/src/DSL/Elements/$NAME ]; then 
            if ! cmp -s $elementName $fbElementName ; then
                echo "Copying $(basename $NAME) over to form-builder Elements"; 
                cp $elementName $fbElementName; 
            fi
        else
            echo "Adding $(basename $NAME) to form-builder Elements"; 
            cp $elementName $fbElementName; 
        fi
        
    done
}

function __updateLookups() {
    echo "Updating Lookups..."
    
    find $WORK_DIR/form-builder-json/Lookups -maxdepth 1  -type f | while read lookupName; do
        NAME=$(basename $lookupName);
        fbLookupName=$WORK_DIR/form-builder/src/DSL/Lookups/$NAME

        if [ -f $WORK_DIR/form-builder/src/DSL/Lookups/$NAME ]; then 
            if ! cmp -s $lookupName $fbLookupName ; then
                echo "Copying $(basename $NAME) over to form-builder Lookups"; 
                cp $lookupName $fbLookupName; 
            fi
        else
            echo "Adding $(basename $NAME) to form-builder Lookups"; 
            cp $lookupName $fbLookupName; 
        fi
        
    done
}
