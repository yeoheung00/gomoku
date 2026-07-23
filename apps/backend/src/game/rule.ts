export const winningCondition = (
  board: number[][],
  x: number,
  y: number,
  color: number,
) => {
  // color: 'black' 또는 'white' (현재 놓은 돌의 색상)

  const directions = [
    { dx: 1, dy: 0 }, // 가로
    { dx: 0, dy: 1 }, // 세로
    { dx: 1, dy: 1 }, // 우하향 대각선
    { dx: 1, dy: -1 }, // 우상향 대각선
  ];

  for (const { dx, dy } of directions) {
    let count = 1; // 현재 놓은 돌 포함

    // 정방향 탐색
    count += countStones(board, x, y, dx, dy, color);
    // 역방향 탐색
    count += countStones(board, x, y, -dx, -dy, color);

    if (count >= 5) {
      return true; // 5목 이상 달성! (오목은 보통 5개 딱 맞추거나 장목 룰 확인)
    }
  }
  return false;
};

function countStones(
  board: number[][],
  startX: number,
  startY: number,
  dx: number,
  dy: number,
  color: number,
) {
  let count = 0;
  let cx = startX + dx;
  let cy = startY + dy;

  while (cx >= 0 && cx < 19 && cy >= 0 && cy < 19 && board[cy][cx] === color) {
    count++;
    cx += dx;
    cy += dy;
  }
  return count;
}
