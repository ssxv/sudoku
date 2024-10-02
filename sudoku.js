const { solveSudoku } = require('./sudoku-util.js');

const INPUT_SUDOKU = [
    null, 2, null, 8, 9, null, null, null, null,
    null, null, null, null, 7, null, 5, 3, null,
    null, 4, null, null, null, null, 9, 6, null,

    null, null, 9, null, null, 1, 3, null, null,
    5, null, null, null, null, null, null, null, 1,
    null, null, 3, 2, null, null, 4, null, null,

    null, 3, 8, null, null, null, null, 7, null,
    null, 7, 6, null, 2, null, null, null, null,
    null, null, null, null, 4, 7, null, 9, null,
];

solveSudoku(INPUT_SUDOKU);
