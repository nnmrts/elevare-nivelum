const findIndexOfSequence = (array, sequence) => {
    let offset = 0;

    while (offset < array.length) {
        let sequenceFound = true;

        for (let index = 0; index < sequence.length; index++) {
            if (array[offset + index] !== sequence[index]) {
                sequenceFound = false;
                break;
            }
        }

        if (sequenceFound) {
            break;
        }

        offset += 1;
    }

    return offset;
};

export default findIndexOfSequence;