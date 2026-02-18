import type { Locale } from "@/lib/i18n";
import type { YachtCategory } from "@/lib/yacht-dice-core";

export const YACHT_CATEGORY_LABELS: Record<Locale, Record<YachtCategory, string>> = {
  en: {
    Ones: "Ones",
    Twos: "Twos",
    Threes: "Threes",
    Fours: "Fours",
    Fives: "Fives",
    Sixes: "Sixes",
    Choice: "Choice",
    "Four of a Kind": "Four of a Kind",
    "Full House": "Full House",
    "Small Straight": "Small Straight",
    "Large Straight": "Large Straight",
    Yacht: "Yacht",
  },
  ko: {
    Ones: "1의 눈",
    Twos: "2의 눈",
    Threes: "3의 눈",
    Fours: "4의 눈",
    Fives: "5의 눈",
    Sixes: "6의 눈",
    Choice: "초이스",
    "Four of a Kind": "포카드",
    "Full House": "풀하우스",
    "Small Straight": "스몰 스트레이트",
    "Large Straight": "라지 스트레이트",
    Yacht: "요트",
  },
};

export const YACHT_CATEGORY_DESCRIPTIONS: Record<Locale, Record<YachtCategory, string>> = {
  en: {
    Ones: "Sum all dice showing 1.",
    Twos: "Sum all dice showing 2.",
    Threes: "Sum all dice showing 3.",
    Fours: "Sum all dice showing 4.",
    Fives: "Sum all dice showing 5.",
    Sixes: "Sum all dice showing 6.",
    Choice: "Sum of all five dice.",
    "Four of a Kind": "If at least four dice match, score the total of all dice.",
    "Full House": "If 3+2 of a kind, score the total of all dice.",
    "Small Straight": "4-number straight (1-4, 2-5, 3-6) gives fixed points.",
    "Large Straight": "5-number straight (1-5, 2-6) gives fixed points.",
    Yacht: "Five of a kind scores 50 points.",
  },
  ko: {
    Ones: "1의 눈이 나온 주사위의 합계입니다.",
    Twos: "2의 눈이 나온 주사위의 합계입니다.",
    Threes: "3의 눈이 나온 주사위의 합계입니다.",
    Fours: "4의 눈이 나온 주사위의 합계입니다.",
    Fives: "5의 눈이 나온 주사위의 합계입니다.",
    Sixes: "6의 눈이 나온 주사위의 합계입니다.",
    Choice: "주사위 5개의 눈 합계입니다.",
    "Four of a Kind": "같은 눈이 4개 이상이면 전체 눈 합계를 얻습니다.",
    "Full House": "트리플+페어 조합이면 전체 눈 합계를 얻습니다.",
    "Small Straight": "연속 4개(1-4, 2-5, 3-6)면 고정 점수입니다.",
    "Large Straight": "연속 5개(1-5, 2-6)면 고정 점수입니다.",
    Yacht: "같은 눈 5개면 50점입니다.",
  },
};
