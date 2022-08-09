import {updateSudo as update} from '@lblod/mu-auth-sudo';
import {v4 as uuid} from 'uuid';

export async function sendSavedOrderTask(orderId) {
    const query = `
    PREFIX ext: <http://mu.semte.ch/vocabularies/ext/>
    INSERT DATA { GRAPH <http://mu.semte.ch/graphs/tasks> {
        <http://mu.semte.ch/graphs/tasks#${uuid()}> a ext:Task;
            ext:taskType "savedOrder";
            ext:order <${orderId}>;
            ext:taskStatus "pending";
            ext:taskCreatedAt "${new Date().toISOString()}".
    } }`;

    return update(query);
}
