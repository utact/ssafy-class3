"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Shuffle, RotateCcw, X } from "lucide-react";

// 학생 이름을 가나다순으로 정렬
const students = [
  "김건남",
  "김민정",
  "김용수",
  "김준이",
  "김태영",
  "나유경",
  "박서영",
  "석정운",
  "석주연",
  "양지원",
  "유소민",
  "유승준",
  "유현진",
  "왕준혁",
  "이서연",
  "이진형",
  "이지원",
  "장준호",
  "정선열",
  "조유리",
  "허원영",
  "허진혁",
];

// 교실 레이아웃 정의
const classroomLayout = {
  left: [
    [true, true, true], // 1행: 3자리
    [true, true, true], // 2행: 3자리
    [true, true, true], // 3행: 3자리
    [true, true, true], // 4행: 3자리
    [true, true, false], // 5행: 2자리 (3번째는 빈 상태)
  ],
  right: [
    [true, true, true], // 1행: 3자리
    [true, true, true], // 2행: 3자리
    [true, true, true], // 3행: 3자리
    [true, true, true], // 4행: 3자리
    [false, true, true], // 5행: 2자리 (1번째는 빈 상태)
  ],
};

type SeatStatus = string | null | "closed";

type Seat = {
  student: SeatStatus;
  row: number;
  col: number;
  side: "left" | "right";
};

// 좌석 초기화 함수를 컴포넌트 외부로 이동
const initializeSeats = (): Seat[] => {
  const allSeats: Seat[] = [];

  // 좌측 좌석 생성
  classroomLayout.left.forEach((row, rowIndex) => {
    row.forEach((isAvailable, colIndex) => {
      if (isAvailable) {
        allSeats.push({
          student: null,
          row: rowIndex,
          col: colIndex,
          side: "left",
        });
      }
    });
  });

  // 우측 좌석 생성
  classroomLayout.right.forEach((row, rowIndex) => {
    row.forEach((isAvailable, colIndex) => {
      if (isAvailable) {
        allSeats.push({
          student: null,
          row: rowIndex,
          col: colIndex,
          side: "right",
        });
      }
    });
  });

  return allSeats;
};

export default function SeatingChart() {
  const [seats, setSeats] = useState<Seat[]>(initializeSeats());
  const [fillFromFront, setFillFromFront] = useState(true);

  // 총 좌석 수 계산
  const totalSeats = 28;
  const studentsCount = students.length;
  const maxSeatsToClose = totalSeats - studentsCount;

  // 좌석 클릭 핸들러 (닫기/열기) - 두 모드 모두에서 사용 가능
  const handleSeatClick = (
    side: "left" | "right",
    row: number,
    col: number
  ) => {
    setSeats((prevSeats) => {
      const currentSeats = [...prevSeats];
      const seatIndex = currentSeats.findIndex(
        (seat) => seat.side === side && seat.row === row && seat.col === col
      );

      if (seatIndex !== -1) {
        const currentSeat = currentSeats[seatIndex];
        const closedSeatsCount = currentSeats.filter(
          (seat) => seat.student === "closed"
        ).length;

        if (currentSeat.student === "closed") {
          // 닫힌 자리를 다시 열기
          currentSeats[seatIndex].student = null;
        } else if (
          currentSeat.student === null &&
          closedSeatsCount < maxSeatsToClose
        ) {
          // 빈 자리를 닫기 (최대 개수 제한)
          currentSeats[seatIndex].student = "closed";
        } else if (
          typeof currentSeat.student === "string" &&
          currentSeat.student !== "closed"
        ) {
          // 학생이 앉은 자리는 클릭할 수 없음 (아무 동작 안함)
          return currentSeats;
        }
      }

      return currentSeats;
    });
  };

  // 각 줄의 학생 수 확인
  const checkRowOccupancy = (seats: Seat[]) => {
    const rowStats = {
      left: Array(5).fill(0),
      right: Array(5).fill(0),
    };

    seats.forEach((seat) => {
      if (typeof seat.student === "string" && seat.student !== "closed") {
        rowStats[seat.side][seat.row]++;
      }
    });

    return rowStats;
  };

  // 혼자 앉는 경우가 있는지 확인
  const hasLonelyStudents = (seats: Seat[]) => {
    const rowStats = checkRowOccupancy(seats);

    // 좌측 체크
    for (let row = 0; row < 5; row++) {
      const maxSeatsInRow = row === 4 ? 2 : 3; // 5행은 2자리, 나머지는 3자리
      if (rowStats.left[row] === 1 && maxSeatsInRow > 1) {
        return true;
      }
    }

    // 우측 체크
    for (let row = 0; row < 5; row++) {
      const maxSeatsInRow = row === 4 ? 2 : 3; // 5행은 2자리, 나머지는 3자리
      if (rowStats.right[row] === 1 && maxSeatsInRow > 1) {
        return true;
      }
    }

    return false;
  };

  // 연결성 확인 (앞뒤 줄에 학생이 있는지)
  const hasGoodConnectivity = (seats: Seat[]) => {
    const rowStats = checkRowOccupancy(seats);

    // 각 사이드별로 연속된 줄에 학생이 있는지 확인
    const checkSideConnectivity = (sideStats: number[]) => {
      const occupiedRows = sideStats
        .map((count, index) => (count > 0 ? index : -1))
        .filter((row) => row !== -1);

      if (occupiedRows.length <= 1) return true; // 1줄 이하면 연결성 문제 없음

      // 연속된 줄이 있는지 확인
      for (let i = 0; i < occupiedRows.length - 1; i++) {
        if (occupiedRows[i + 1] - occupiedRows[i] === 1) {
          return true; // 연속된 줄이 하나라도 있으면 OK
        }
      }
      return false;
    };

    return (
      checkSideConnectivity(rowStats.left) &&
      checkSideConnectivity(rowStats.right)
    );
  };

  // 같은 줄 학생들을 붙여서 앉히는 함수
  const arrangeStudentsInRow = (
    seats: Seat[],
    side: "left" | "right",
    row: number,
    students: string[]
  ) => {
    const rowSeats = seats.filter(
      (seat) => seat.side === side && seat.row === row
    );
    const availableSeats = rowSeats.filter((seat) => seat.student === null);

    if (students.length === 0 || availableSeats.length === 0) return;

    // 사용 가능한 자리들을 열 순서로 정렬
    availableSeats.sort((a, b) => a.col - b.col);

    // 학생들을 연속된 자리에 배치
    if (students.length === 1) {
      // 1명인 경우 가운데 자리에 배치 (가능하면)
      const middleIndex = Math.floor(availableSeats.length / 2);
      const targetSeat = availableSeats[middleIndex];
      const seatIndex = seats.findIndex(
        (seat) =>
          seat.side === targetSeat.side &&
          seat.row === targetSeat.row &&
          seat.col === targetSeat.col
      );
      if (seatIndex !== -1) {
        seats[seatIndex].student = students[0];
      }
    } else {
      // 2명 이상인 경우 연속된 자리에 배치
      for (let i = 0; i < students.length && i < availableSeats.length; i++) {
        const targetSeat = availableSeats[i];
        const seatIndex = seats.findIndex(
          (seat) =>
            seat.side === targetSeat.side &&
            seat.row === targetSeat.row &&
            seat.col === targetSeat.col
        );
        if (seatIndex !== -1) {
          seats[seatIndex].student = students[i];
        }
      }
    }
  };

  // 랜덤 배치 함수 (개선된 버전)
  const assignSeatsRandomly = (maxAttempts = 100) => {
    let attempts = 0;
    let bestSeats: Seat[] = [];

    while (attempts < maxAttempts) {
      const newSeats = [...seats]; // 현재 seats 상태를 유지 (닫힌 자리 포함)
      const shuffledStudents = [...students].sort(() => Math.random() - 0.5);

      // 학생이 앉은 자리만 초기화 (닫힌 자리는 유지)
      newSeats.forEach((seat) => {
        if (typeof seat.student === "string" && seat.student !== "closed") {
          seat.student = null;
        }
      });

      // 사용 가능한 자리만 필터링 (닫힌 자리 제외)
      const availableSeats = newSeats.filter((seat) => seat.student === null);

      // 각 줄별로 학생 수를 랜덤하게 분배
      const distribution: { [key: string]: string[] } = {};

      // 사용 가능한 줄만 키 생성
      for (let row = 0; row < 5; row++) {
        const leftAvailable = availableSeats.filter(
          (seat) => seat.side === "left" && seat.row === row
        ).length;
        const rightAvailable = availableSeats.filter(
          (seat) => seat.side === "right" && seat.row === row
        ).length;

        if (leftAvailable > 0) distribution[`left-${row}`] = [];
        if (rightAvailable > 0) distribution[`right-${row}`] = [];
      }

      // 학생들을 랜덤하게 줄에 분배
      shuffledStudents.forEach((student) => {
        const availableRows = Object.keys(distribution).filter((key) => {
          const [side, row] = key.split("-");
          const availableSeatsInRow = availableSeats.filter(
            (seat) => seat.side === side && seat.row === Number.parseInt(row)
          ).length;
          return distribution[key].length < availableSeatsInRow;
        });

        if (availableRows.length > 0) {
          const randomRow =
            availableRows[Math.floor(Math.random() * availableRows.length)];
          distribution[randomRow].push(student);
        }
      });

      // 각 줄에 학생들을 배치 (붙여서 앉히기)
      Object.keys(distribution).forEach((key) => {
        const [side, row] = key.split("-");
        const studentsInRow = distribution[key];
        if (studentsInRow.length > 0) {
          arrangeStudentsInRow(
            newSeats,
            side as "left" | "right",
            Number.parseInt(row),
            studentsInRow
          );
        }
      });

      // 조건 확인
      if (!hasLonelyStudents(newSeats) && hasGoodConnectivity(newSeats)) {
        return newSeats;
      }

      bestSeats = newSeats;
      attempts++;
    }

    // 최대 시도 후에도 조건을 만족하지 못하면 최선의 결과 반환
    return bestSeats;
  };

  // 앞에서부터 채우기 (행 우선)
  const fillFromFrontByRow = (seats: Seat[], students: string[]) => {
    const newSeats = [...seats];
    let studentIndex = 0;

    // 학생이 앉은 자리만 초기화 (닫힌 자리는 유지)
    newSeats.forEach((seat) => {
      if (typeof seat.student === "string" && seat.student !== "closed") {
        seat.student = null;
      }
    });

    // 행별로 채우기 (1행부터 5행까지)
    for (let row = 0; row < 5; row++) {
      // 좌측 먼저
      for (let col = 0; col < classroomLayout.left[row].length; col++) {
        if (classroomLayout.left[row][col] && studentIndex < students.length) {
          const seatIndex = newSeats.findIndex(
            (seat) =>
              seat.side === "left" &&
              seat.row === row &&
              seat.col === col &&
              seat.student !== "closed"
          );
          if (seatIndex !== -1) {
            newSeats[seatIndex].student = students[studentIndex];
            studentIndex++;
          }
        }
      }

      // 우측
      for (let col = 0; col < classroomLayout.right[row].length; col++) {
        if (classroomLayout.right[row][col] && studentIndex < students.length) {
          const seatIndex = newSeats.findIndex(
            (seat) =>
              seat.side === "right" &&
              seat.row === row &&
              seat.col === col &&
              seat.student !== "closed"
          );
          if (seatIndex !== -1) {
            newSeats[seatIndex].student = students[studentIndex];
            studentIndex++;
          }
        }
      }
    }

    return newSeats;
  };

  // 자리 배치 함수
  const assignSeats = () => {
    const closedSeatsCount = seats.filter(
      (seat) => seat.student === "closed"
    ).length;
    const availableSeatsCount = totalSeats - closedSeatsCount;

    // 사용 가능한 자리가 학생 수보다 적으면 경고
    if (availableSeatsCount < studentsCount) {
      alert(
        `사용 가능한 자리(${availableSeatsCount}개)가 학생 수(${studentsCount}명)보다 적습니다. 일부 자리를 열어주세요.`
      );
      return;
    }

    const shuffledStudents = [...students].sort(() => Math.random() - 0.5);

    if (fillFromFront) {
      // 앞에서부터 채우는 방식
      const newSeats = fillFromFrontByRow(seats, shuffledStudents);
      setSeats(newSeats);
    } else {
      // 랜덤 자리 배치 방식
      const newSeats = assignSeatsRandomly();
      setSeats(newSeats);
    }
  };

  // 초기화 함수
  const resetSeats = () => {
    setSeats(initializeSeats());
  };

  // 좌석 렌더링 함수
  const renderSeats = (side: "left" | "right") => {
    const layout =
      side === "left" ? classroomLayout.left : classroomLayout.right;

    return (
      <div className="space-y-3">
        {layout.map((row, rowIndex) => (
          <div
            key={`${side}-row-${rowIndex}`}
            className="flex justify-center gap-2"
          >
            {row.map((isAvailable, colIndex) => {
              if (!isAvailable) {
                return (
                  <div
                    key={`${side}-${rowIndex}-${colIndex}`}
                    className="w-16 h-16 opacity-0"
                  />
                );
              }

              const seat = seats.find(
                (s) =>
                  s.side === side && s.row === rowIndex && s.col === colIndex
              );
              const isClickable =
                seat?.student === null || seat?.student === "closed";

              return (
                <div
                  key={`${side}-${rowIndex}-${colIndex}`}
                  className={`w-16 h-16 border-2 rounded-lg flex items-center justify-center text-xs font-medium transition-colors relative ${
                    seat?.student === "closed"
                      ? "bg-red-100 border-red-300 text-red-600"
                      : typeof seat?.student === "string"
                      ? "bg-blue-100 border-blue-300 text-blue-800"
                      : "bg-gray-50 border-gray-200 text-gray-400"
                  } ${isClickable ? "cursor-pointer hover:bg-gray-100" : ""}`}
                  onClick={() => handleSeatClick(side, rowIndex, colIndex)}
                >
                  {seat?.student === "closed" ? (
                    <X className="w-4 h-4" />
                  ) : typeof seat?.student === "string" ? (
                    seat.student
                  ) : (
                    "빈자리"
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    );
  };

  const closedSeatsCount = seats.filter(
    (seat) => seat.student === "closed"
  ).length;
  const availableSeatsCount = totalSeats - closedSeatsCount;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-center text-2xl font-bold text-gray-800">
              SSAFY 대전 3반 좌석배치
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-6">
              <div className="flex items-center space-x-2">
                <Switch
                  id="fill-mode"
                  checked={fillFromFront}
                  onCheckedChange={setFillFromFront}
                />
                <Label htmlFor="fill-mode" className="text-sm">
                  {fillFromFront ? "앞에서부터 채우기" : "랜덤 자리 배치"}
                </Label>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={assignSeats}
                  className="flex items-center gap-2"
                >
                  <Shuffle className="w-4 h-4" />
                  자리 배치
                </Button>
                <Button
                  onClick={resetSeats}
                  variant="outline"
                  className="flex items-center gap-2 bg-transparent"
                >
                  <RotateCcw className="w-4 h-4" />
                  초기화
                </Button>
              </div>
            </div>

            <div className="text-center mb-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-700">
                닫힌 자리: {closedSeatsCount}개 | 사용 가능한 자리:{" "}
                {availableSeatsCount}개 | 학생 수: {studentsCount}명
              </p>
              <p className="text-xs text-blue-600 mt-1">
                빈 자리나 닫힌 자리를 클릭하여 자리를 열거나 닫을 수 있습니다
                (최대 {maxSeatsToClose}개까지 닫기 가능)
              </p>
            </div>

            {/* 교실 레이아웃 */}
            <div className="bg-white rounded-lg p-6 shadow-sm">
              {/* 칠판 */}
              <div className="bg-green-600 text-white text-center py-3 rounded-lg mb-8 font-semibold">
                칠판
              </div>

              {/* 좌석 배치 */}
              <div className="flex justify-between items-start gap-8">
                {/* 좌측 */}
                <div className="flex-1">
                  <h3 className="text-center font-semibold mb-4 text-gray-700">
                    좌측
                  </h3>
                  {renderSeats("left")}
                </div>

                {/* 중앙 통로 */}
                <div className="w-8 flex items-center justify-center">
                  <div className="w-1 h-32 bg-gray-300 rounded"></div>
                </div>

                {/* 우측 */}
                <div className="flex-1">
                  <h3 className="text-center font-semibold mb-4 text-gray-700">
                    우측
                  </h3>
                  {renderSeats("right")}
                </div>
              </div>
            </div>

            {/* 학생 목록 */}
            <div className="mt-6 bg-white rounded-lg p-4 shadow-sm">
              <h3 className="font-semibold mb-3 text-gray-700">
                학생 목록 (총 {students.length}명)
              </h3>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-7 gap-2 text-sm">
                {students.map((student, index) => (
                  <div
                    key={student}
                    className="bg-gray-100 px-2 py-1 rounded text-center text-gray-700"
                  >
                    {student}
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
