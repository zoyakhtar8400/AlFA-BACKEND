window.whatsnewscriptLoaded = true;
const changeLog = require('../util/Changelog.json');

function initialize() {
    // changelog-container
    if (changeLog) {
        $('#changelog-container.header').html(`${changeLog.app} changelog`);
        $('#changelog-items-container-id').empty();

        let changeLogs = changeLog.changelogs;
        if (changeLogs && changeLogs.length > 0) {
            changeLogs.forEach(currentChange => {
                let changelogItem = $('<div>', {
                    class: 'changelog-item'
                });
                let version = $('<div>', {
                    class: 'version',
                    html: `Version - ${currentChange.version}`
                });

                let date = $('<div>', {
                    class: 'date',
                    html: currentChange.releaseDate
                });
                changelogItem.append(version);
                changelogItem.append(date);

                let logs = currentChange.logs;

                for (const key in logs) {
                    if (logs.hasOwnProperty(key)) {
                        const list = logs[key];
                        let content = $('<div>', {
                            class: 'content'
                        });
                        let contenttype = $('<div>', {
                            class: `type ${String(key).toLowerCase().replace(/\s/g, '')}`,
                            html: key
                        });
                        content.append(contenttype);
                        list.forEach(change => {
                            let changeLabel = $('<div>', {
                                class: 'title',
                                html: `&bull;  ${change}`
                            });
                            content.append(changeLabel);
                        });
                        changelogItem.append(content);
                    }

                }
                $('#changelog-items-container-id').append(changelogItem);
            });
        }


    }
    $('#changelogModal').modal('show');
}

initialize();