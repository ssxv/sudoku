const SUDOKU_LENGTH = 9;
const BLOCK_LENGTH = 3;
let sudokuSolved = false;
let sudokuError = null;

const prepareHouseIndex = () => {
    const houses = [
        [], // hrows
        [], // vrows
        []  // blocks
    ];

    for (let i = 0; i < SUDOKU_LENGTH; i++) {
        const hrows = [];
        const vrows = [];
        const blocks = [];
        for (let j = 0; j < SUDOKU_LENGTH; j++) {
            hrows.push(SUDOKU_LENGTH * i + j);
            vrows.push(SUDOKU_LENGTH * j + i);

            if (j < BLOCK_LENGTH) {
                for (let k = 0; k < BLOCK_LENGTH; k++) {
                    const a = Math.floor(i / BLOCK_LENGTH) * SUDOKU_LENGTH * BLOCK_LENGTH;
                    const b = (i % BLOCK_LENGTH) * BLOCK_LENGTH;
                    const blockStart = a + b;
                    blocks.push(blockStart + SUDOKU_LENGTH * j + k);
                }
            }
        }
        houses[0].push(hrows);
        houses[1].push(vrows);
        houses[2].push(blocks);
    }

    return houses;
};

// maintains index of horizontal rows, vertical rows and blocks. In that order.
const HOUSE_TYPES = prepareHouseIndex();
const SUDOKU = [];

const prepareSudoku = (INPUT_SUDOKU) => {
    for (let i = 0; i < INPUT_SUDOKU.length; i++) {
        SUDOKU[i] = {
            value: INPUT_SUDOKU[i] ? INPUT_SUDOKU[i] : null,
            candidateSet: INPUT_SUDOKU[i] ? new Set() : new Set([1, 2, 3, 4, 5, 6, 7, 8, 9]),
        };
    }
}

const setSudokuValue = (sudokuIndex, value) => {
    if (value) {
        SUDOKU[sudokuIndex].value = value;
        SUDOKU[sudokuIndex].candidateSet = new Set();
    }
}

const visualEliminationOfCandidates = () => {

    for (const houseType of HOUSE_TYPES) {
        for (const house of houseType) {
            const candidatesToRemove = getNumbersInHouse(house);
            for (const sudokuIndex of house) {
                removeCandidatesFromSudokuIndex(sudokuIndex, candidatesToRemove);
            }
        }
    }
    return false;
}

const isSudokuSolved = () => {
    for (let i = 0; i < SUDOKU.length; i++) {
        if (!SUDOKU[i].value) return false;
    }
    return true;
}

const getNumbersInHouse = (house) => {
    const numbersInHouseSet = new Set();
    for (const sudokuIndex of house) {
        if (SUDOKU[sudokuIndex] && SUDOKU[sudokuIndex].value) {
            numbersInHouseSet.add(SUDOKU[sudokuIndex].value);
        }
    }
    return [...numbersInHouseSet];
}

const getNumbersNotInHouse = (house) => {
    const numbersInHouseSet = new Set(getNumbersInHouse(house));
    let numbersNotInHouse = [];
    for (let i = 1; i <= 9; i++) {
        if (!numbersInHouseSet.has(i)) numbersNotInHouse.push(i);
    }
    return numbersNotInHouse;
}

/* openSingles
 * --------------
 * checks for houses with just one empty cell - fills it in board variable if so
 * returns - affectedCells - list of updated sudokuIndexes
 * -----------------------------------------------------------------*/
const openSingles = () => {

    for (const houseType of HOUSE_TYPES) {
        let completeCount = 0;
        for (const house of houseType) {

            const emptyCells = [];

            for (const sudokuIndex of house) {
                if (!SUDOKU[sudokuIndex].value) {
                    emptyCells.push({ house, sudokuIndex });
                    // more than one empty cell
                    if (emptyCells.length > 1) break;
                }
            }

            if (emptyCells.length === 1) {
                const { house, sudokuIndex } = emptyCells[0];
                const numbersNotInHouse = getNumbersNotInHouse(house);
                if (numbersNotInHouse.length > 1) {
                    sudokuError = {
                        message: 'SUDOKU ERROR',
                        strategy: 'openSingles',
                        house,
                        numbersNotInHouse,
                    };
                    return -1;
                }
                setSudokuValue(sudokuIndex, numbersNotInHouse[0]);
                return [sudokuIndex];
            }

            if (emptyCells.length === 0) {
                completeCount++;
                if (completeCount === SUDOKU_LENGTH) {
                    sudokuSolved = true;
                    return -1;
                }
            }
        }
    }
    return false;
}

/* singleCandidate
 * --------------
 * Looks for cells with only one candidate
 * returns - affectedCells
 * -----------------------------------------------------------------*/
const singleCandidate = () => {
    // before we start with candidate strategies, we need to update candidates from last round:
    visualEliminationOfCandidates();

    // for each sudokuIndex
    for (let sudokuIndex = 0; sudokuIndex < SUDOKU.length; sudokuIndex++) {
        const candidateSet = SUDOKU[sudokuIndex].candidateSet;
        const possibleCandidates = [];
        for (const candidate of candidateSet) {
            possibleCandidates.push(candidate);
            if (possibleCandidates.length > 1) break;
        }

        if (possibleCandidates.length === 1) {
            const digit = possibleCandidates[0];
            setSudokuValue(sudokuIndex, digit);
            return [sudokuIndex]; //one step at the time
        }
    }
    return false;
}

/* visualElimination
 * --------------
 * Looks for houses where a digit only appears in one slot, meaning we know the digit goes in that slot.
 * returns affectedCells
 * -----------------------------------------------------------------*/
const visualElimination = () => {

    for (const houseType of HOUSE_TYPES) {
        for (const house of houseType) {
            const numbersNotInHouse = getNumbersNotInHouse(house);
            for (const number of numbersNotInHouse) {
                const possibleSudokuIndexes = [];
                for (const sudokuIndex of house) {
                    if (SUDOKU[sudokuIndex].candidateSet.has(number)) {
                        possibleSudokuIndexes.push(sudokuIndex);
                        if (possibleSudokuIndexes.length > 1) break;
                    }
                }

                if (possibleSudokuIndexes.length === 1) {
                    const sudokuIndex = possibleSudokuIndexes[0];
                    setSudokuValue(sudokuIndex, number);
                    return [sudokuIndex];
                }
            }
        }
    }
    return false;
}

const removeCandidatesFromSudokuIndex = (sudokuIndex, candidatesToRemove) => {
    const candidateSet = SUDOKU[sudokuIndex].candidateSet;
    candidatesToRemove.forEach(candidate => {
        if (candidateSet.has(candidate)) candidateSet.delete(candidate);
    });
}

const removeCandidatesFromSudokuIndexes = (sudokuIndexes, combinedCandidates) => {
    const cellsUpdated = [];
    sudokuIndexes.forEach((sudokuIndex) => {
        const candidateSet = SUDOKU[sudokuIndex].candidateSet;
        combinedCandidates.forEach((combinedCandidate) => {
            if (candidateSet.has(combinedCandidate)) {
                candidateSet.delete(combinedCandidate);
                cellsUpdated.push(sudokuIndex);
            }
        });
    });
    return cellsUpdated;
};

const checkCandidateCombinations = (n, house, startIndex, combineInfos, minIndexes) => {
    for (let i = Math.max(startIndex, minIndexes[startIndex]); i < SUDOKU_LENGTH - n + startIndex; i++) {
        //never check this cell again, in this loop
        minIndexes[startIndex] = i + 1;
        //or in a this loop deeper down in recursions
        minIndexes[startIndex + 1] = i + 1;

        const sudokuIndex = house[i];
        const candidateSet = SUDOKU[sudokuIndex].candidateSet;

        if (candidateSet.size === 0 || candidateSet.size > n)
            continue;

        // try adding this cell and it's cellCandidates,
        // but first need to check that that doesn't make (unique) amount of
        // candidates in combineInfo > n

        // if this is the first item we add, we don't need this check (above one is enough)
        if (combineInfos.length > 0) {
            let combinedCandidatesCount = 0;
            combineInfos.forEach((info) => {
                const { candidateSet: combineInfoCandidateSet } = info;
                combineInfoCandidateSet.forEach((candidate) => {
                    if (!candidateSet.has(candidate)) combinedCandidatesCount++;
                });
            });
            // combined candidates spread over > n cells, won't work
            if (combinedCandidatesCount > n) continue;
        }

        combineInfos.push({ sudokuIndex, candidateSet });

        if (startIndex < n - 1) {
            // still need to go deeper into combo
            const result = checkCandidateCombinations(n, house, startIndex + 1, combineInfos, minIndexes);
            // when we come back, check if that's because we found answer.
            // if so, return with it, otherwise, keep looking
            if (result !== false)
                return result;
        }

        // check if we match our pattern
        // if we have managed to combine n-1 cells,
        // (we already know that combinedCandidates is > n)
        // then we found a match!
        if (combineInfos.length === n) {
            // now we need to check whether this eliminates any candidates
            const sudokuIndexesWithCandidatesSet = new Set();
            const combinedCandidates = []; // not unique either..
            combineInfos.forEach((info) => {
                const { sudokuIndex, candidateSet: combineInfoCandidateSet } = info;
                sudokuIndexesWithCandidatesSet.add(sudokuIndex);
                combineInfoCandidateSet.forEach((candidate) => {
                    combinedCandidates.push(candidate);
                });
            });

            // get all sudokuIndex in house EXCEPT sudokuIndexSet
            const cellsEffected = [];
            for (let y = 0; y < SUDOKU_LENGTH; y++) {
                if (!sudokuIndexesWithCandidatesSet.has(house[y])) {
                    cellsEffected.push(house[y]);
                }
            }

            // remove all candidates on house, except the on cells matched in pattern
            const cellsUpdated = removeCandidatesFromSudokuIndexes(cellsEffected, combinedCandidates);
            if (cellsUpdated.length > 0) return cellsUpdated;
        }
    }
    if (startIndex > 0) {
        // if we added a value to our combo check, but failed to find pattern, we now need drop that value and go back up in chain and continue to check..
        if (combineInfos.length > startIndex - 1) combineInfos.pop();
    }
    return false;
}

/* nakedCandidates
 * --------------
 * looks for exactly n number of cells in house, which together has exactly n unique candidates. 
 * this means these candidates will go into these cells, and can be removed elsewhere in house.
 * returns affectedCells
 * -----------------------------------------------------------------*/
const nakedCandidates = (n) => {

    for (const houseType of HOUSE_TYPES) {
        for (const house of houseType) {
            if (getNumbersNotInHouse(house).length <= n) continue;
            const result = checkCandidateCombinations(n, house, 0, [], [-1]);
            if (result !== false) return result;
        }
    }
    return false;
}

/* nakedPair
 * --------------
 * see nakedCandidateElimination for explanation
 * returns affectedCells
 * -----------------------------------------------------------------*/
const nakedPair = () => {
    return nakedCandidates(2);
}

const housesForSudokuIndex = (sudokuIndex) => {
    const houses = [];
    const hrow = Math.floor(sudokuIndex / SUDOKU_LENGTH);
    houses.push(hrow);
    const vrow = Math.floor(sudokuIndex % SUDOKU_LENGTH);
    houses.push(vrow);
    const block = (Math.floor(hrow / BLOCK_LENGTH) * BLOCK_LENGTH) + Math.floor(vrow / BLOCK_LENGTH);
    houses.push(block);
    return houses;
};

/* pointingElimination
 * --------------
 * if candidates of a type (digit) in a box only appear on one row, all other
 * same type candidates can be removed from that row
 ------------OR--------------
 * same as above, but row instead of box, and vice versa.
 * returns affectedCells
 * -----------------------------------------------------------------*/
const pointingElimination = () => {

    for (let houseTypeIndex = 0; houseTypeIndex < HOUSE_TYPES.length; houseTypeIndex++) {
        const houseType = HOUSE_TYPES[houseTypeIndex];
        for (const house of houseType) {
            const numbersNotInHouse = getNumbersNotInHouse(house);
            for (const digit of numbersNotInHouse) {
                // check if digit (candidate) only appears in one row (if checking boxes), or only in one box (if checking rows)
                // when point checking from box, need to compare both kind of rows
                // that box cells are also part of, so use houseTwoId as well
                let houseId = -1;
                let sameAltHouse = true;
                let houseTwoId = -1;
                let sameAltTwoHouse = true;
                const sudokuIndexesWithCandidateSet = new Set();

                for (const sudokuIndex of house) {
                    if (SUDOKU[sudokuIndex].candidateSet.has(digit)) {
                        const sudokuIndexHouses = housesForSudokuIndex(sudokuIndex);
                        const newHouseId = (houseTypeIndex === 2) ? sudokuIndexHouses[0] : sudokuIndexHouses[2];
                        const newHouseTwoId = (houseTypeIndex === 2) ? sudokuIndexHouses[1] : sudokuIndexHouses[2];

                        if (sudokuIndexesWithCandidateSet.size > 0) {
                            if (houseId !== newHouseId) sameAltHouse = false;
                            if (houseTwoId !== newHouseTwoId) sameAltTwoHouse = false;
                            // not in same altHouse (box/row)
                            if (sameAltHouse === false && sameAltTwoHouse === false) break;
                        }
                        houseId = newHouseId;
                        houseTwoId = newHouseTwoId;
                        sudokuIndexesWithCandidateSet.add(sudokuIndex);
                    }
                }

                if ((sameAltHouse === true || sameAltTwoHouse === true) && sudokuIndexesWithCandidateSet.size > 0) {
                    // we still need to check that this actually eliminates something, i.e. these possible cells can't be only in house

                    const sudokuIndexHouses = housesForSudokuIndex([...sudokuIndexesWithCandidateSet][0]);
                    let altHouseType = 2;
                    if (houseTypeIndex === 2) {
                        if (sameAltHouse)
                            altHouseType = 0;
                        else
                            altHouseType = 1;
                    }

                    const altHouse = HOUSE_TYPES[altHouseType][sudokuIndexHouses[altHouseType]];
                    const cellsEffected = [];
                    // need to remove cellsWithCandidate - from cells to remove from
                    for (const sudokuIndex of altHouse) {
                        if (!sudokuIndexesWithCandidateSet.has(sudokuIndex)) {
                            cellsEffected.push(sudokuIndex);
                        }
                    }

                    // remove all candidates on altHouse, outside of house
                    const cellsUpdated = removeCandidatesFromSudokuIndexes(cellsEffected, [digit]);
                    if (cellsUpdated.length > 0) return cellsUpdated;
                }
            }
        }
    }
    return false;
}

const checkLockedCandidates = (n, house, startIndex, combineInfos, minIndexes) => {

    for (let i = Math.max(startIndex, minIndexes[startIndex]); i <= SUDOKU_LENGTH - n + startIndex; i++) {
        //never check this cell again, in this loop
        minIndexes[startIndex] = i + 1;
        minIndexes[startIndex + 1] = i + 1;
        const candidate = i + 1;

        const possibleSudokuIndexesSet = new Set();
        house.forEach((sudokuIndex) => {
            if (SUDOKU[sudokuIndex].candidateSet.has(candidate))
                possibleSudokuIndexesSet.add(sudokuIndex);
        });

        if (possibleSudokuIndexesSet.size === 0 || possibleSudokuIndexesSet.size > n)
            continue;

        // try adding this candidate and it's possible cells,
        // but first need to check that that doesn't make (unique) amount of
        // possible cells in combineInfo > n
        if (combineInfos.length > 0) {
            let combinedCandidatesCount = 0;
            combineInfos.forEach((info) => {
                const { possibleSudokuIndexesSet: combineInfoPossibleSudokuIndexesSet } = info;
                combineInfoPossibleSudokuIndexesSet.forEach((possibleSudokuIndex) => {
                    if (!possibleSudokuIndexesSet.has(possibleSudokuIndex))
                        combinedCandidatesCount++;
                });
            });
            // combined candidates spread over > n cells, won't work
            if (combinedCandidatesCount > n) continue;
        }

        combineInfos.push({ candidate: candidate, possibleSudokuIndexesSet });

        if (startIndex < n - 1) {
            const result = checkLockedCandidates(n, house, startIndex + 1, combineInfos, minIndexes);
            if (result !== false)
                return result;
        }
        // check if we match our pattern
        // if we have managed to combine n-1 candidates,
        // (we already know that cellsWithCandidates is <= n)
        // then we found a match!
        if (combineInfos.length === n) {
            // now we need to check whether this eliminates any candidates
            const sudokuIndexSet = new Set();
            const combinedCandidateSet = new Set();
            combineInfos.forEach((info) => {
                const { candidate, possibleSudokuIndexesSet: combineInfoPossibleSudokuIndexesSet } = info;
                combinedCandidateSet.add(candidate);
                combineInfoPossibleSudokuIndexesSet.forEach((sudokuIndex) => {
                    sudokuIndexSet.add(sudokuIndex);
                });
            });

            const candidatesToRemove = [];
            for (let c = 1; c <= SUDOKU_LENGTH; c++) {
                if (!combinedCandidateSet.has(c))
                    candidatesToRemove.push(c);
            }

            // remove all candidates on house, except the on cells matched in pattern
            const cellsUpdated = removeCandidatesFromSudokuIndexes([...sudokuIndexSet], candidatesToRemove);
            if (cellsUpdated.length > 0) return cellsUpdated;
        }
    }
    if (startIndex > 0) {
        //if we added a value to our combo check, but failed to find pattern, we now need drop that value and go back up in chain and continu to check..
        if (combineInfos.length > startIndex - 1) {
            combineInfos.pop();
        }
    }
    return false;
}

/* hiddenLockedCandidates
 * --------------
 * looks for exactly n number of cells in house, which together has exactly n unique candidates. 
 * this means these candidates will go into these cells, and can be removed elsewhere in house.
 * returns affectedCells
 * -----------------------------------------------------------------*/
const hiddenLockedCandidates = (n) => {

    for (const houseType of HOUSE_TYPES) {
        for (const house of houseType) {
            if (getNumbersNotInHouse(house).length <= n)
                continue;
            const result = checkLockedCandidates(n, house, 0, [], [-1]);
            if (result !== false)
                return result;
        }
    }
    return false;
}

/* hiddenPair
 * --------------
 * see hiddenLockedCandidates for explanation
 * returns affectedCells
 * -----------------------------------------------------------------*/
const hiddenPair = () => {
    return hiddenLockedCandidates(2);
}

/* nakedTriplet
 * --------------
 * see nakedCandidateElimination for explanation
 * returns affectedCells
 * -----------------------------------------------------------------*/
const nakedTriplet = () => {
    return nakedCandidates(3);
}

/* hiddenTriplet
 * --------------
 * see hiddenLockedCandidates for explanation
 * returns affectedCells
 * -----------------------------------------------------------------*/
const hiddenTriplet = () => {
    return hiddenLockedCandidates(3);
}

/* nakedQuad
 * --------------
 * see nakedCandidateElimination for explanation
 * returns affectedCells
 * -----------------------------------------------------------------*/
const nakedQuad = () => {
    return nakedCandidates(4);
}

/* hiddenQuad
 * --------------
 * see hiddenLockedCandidates for explanation
 * returns affectedCells
 * -----------------------------------------------------------------*/
const hiddenQuad = () => {
    return hiddenLockedCandidates(4);
}

const strategies = [
    openSingles,
    singleCandidate,
    visualElimination,
    nakedPair,
    pointingElimination,
    hiddenPair,
    nakedTriplet,
    hiddenTriplet,
    nakedQuad,
    hiddenQuad,
];

// eslint-disable-next-line no-unused-vars
let solveFnCount = 0;

const solveFn = (strategyIndex) => {

    if (sudokuSolved) return false;
    if (sudokuError) {
        console.log(sudokuError);
        return false;
    }

    solveFnCount++;
    strategyIndex = strategyIndex || 0;
    const strategyFunction = strategies[strategyIndex];
    const affectedCells = strategyFunction();

    // if this strategy did not affect any cells, then use the next strategy
    if (affectedCells === false) {
        if (strategies.length > strategyIndex + 1) {
            return solveFn(strategyIndex + 1);
        } else {
            // no more strategies
        }
    }

    return true;
};

// const isSudokuValid = () => {
//     houseTypes.forEach((houseType) => {
//         for (let i = 0; i < SUDOKU_LENGTH; i++) {
//             const house = houseType[i];
//             if (getNumbersInHouse(house).length !== 9 &&
//                 getNumbersNotInHouse(house).length !== 0) {
//                 return false;
//             }
//         }
//     });
//     return true;
// }

const printSudoku = () => {
    const printRowSeparator = () => {
        console.log('-------------------------');
    };
    const printColForRows = (startRow, endRow) => {
        for (let i = startRow; i < endRow; i++) {
            let s = '';
            for (let j = 0; j < Math.sqrt(SUDOKU.length); j++) {
                if (j % 3 === 0) {
                    s += `| ${SUDOKU[(i * 9) + j].value} `;
                } else {
                    s += `${SUDOKU[(i * 9) + j].value} `;
                }
            }
            s += '|';
            console.log(s);
        }
    }
    printRowSeparator();
    printColForRows(0, 3);
    printRowSeparator();
    printColForRows(3, 6);
    printRowSeparator();
    printColForRows(6, 9);
    printRowSeparator();
}

const solveSudoku = (INPUT_SUDOKU) => {

    prepareSudoku(INPUT_SUDOKU);
    visualEliminationOfCandidates();

    let isUnsolved = !isSudokuSolved();
    while (isUnsolved) {
        isUnsolved = solveFn();
    }

    printSudoku();
};



module.exports = {
    solveSudoku,
}
