import Octicons from "@expo/vector-icons/Octicons";
import { useIsFocused } from "@react-navigation/native";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Dimensions,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TouchableHighlight,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { SearchResults } from "./send/SearchTab";
import { useWarmCache } from "../../action/useSendAsync";
import { Account } from "../../model/account";
import { resync } from "../../sync/sync";
import useTabBarHeight from "../../vendor/useTabBarHeight";
import { TitleAmount } from "../shared/Amount";
import { HistoryListSwipe } from "../shared/HistoryList";
import { OctName } from "../shared/InputBig";
import { OfflineHeader } from "../shared/OfflineHeader";
import { SearchHeader } from "../shared/SearchHeader";
import Spacer from "../shared/Spacer";
import { SwipeUpDown, SwipeUpDownRef } from "../shared/SwipeUpDown";
import { useNav } from "../shared/nav";
import { color, touchHighlightUnderlay } from "../shared/style";
import { TextBody, TextLight } from "../shared/text";
import { useWithAccount } from "../shared/withAccount";

export default function HomeScreen() {
  const Inner = useWithAccount(HomeScreenInner);
  return <Inner />;
}

function HomeScreenInner({ account }: { account: Account }) {
  const bottomSheetRef = useRef<SwipeUpDownRef>(null);
  const scrollRef = useRef<ScrollView>(null);
  const isScrollDragged = useRef<boolean>(false);
  const nav = useNav();
  const isFocused = useIsFocused();
  const tabBarHeight = useTabBarHeight();
  const ins = useSafeAreaInsets();
  const top = Math.max(ins.top, 16);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    if (nav.getParent()) {
      // @ts-ignore
      const unsub = nav.getParent().addListener("tabPress", (e: Event) => {
        if (isFocused && bottomSheetRef.current) {
          e.preventDefault();
          bottomSheetRef.current.collapse();
        }
      });

      return unsub;
    }
  }, [nav, isFocused]);

  console.log(
    `[HOME] rendering ${account.name}, ${account.recentTransfers.length} ops`
  );

  // Initialize DaimoOpSender immediately for speed.
  const keySlot = account.accountKeys.find(
    (keyData) => keyData.pubKey === account.enclavePubKey
  )?.slot;
  useWarmCache(
    account.enclaveKeyName,
    account.address,
    keySlot,
    account.homeChainId
  );
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await resync("Home screen pull refresh");
    setRefreshing(false);
    if (scrollRef.current && !isScrollDragged.current) {
      scrollRef.current.scrollTo({ y: 0, animated: true });
    }
  }, []);

  // Show search results when search is focused.
  const [searchPrefix, setSearchPrefix] = useState<string | undefined>();

  // Show history
  const histListMini = (
    <HistoryListSwipe account={account} showDate={false} maxToShow={5} />
  );
  const histListFull = <HistoryListSwipe account={account} showDate />;

  const onScrollBeginDrag = () => {
    isScrollDragged.current = true;
  };
  const onScrollEndDrag = () => {
    isScrollDragged.current = false;
    if (scrollRef.current && !refreshing) {
      scrollRef.current.scrollTo({ y: 0, animated: true });
    }
  };

  const onOpenTransactionsModal = () => {
    setIsModalOpen(true);
  };
  const onCloseTransactionsModal = () => {
    setIsModalOpen(false);
  };

  return (
    <View>
      <OfflineHeader shouldAddPaddingWhenOnline={false} />
      <ScrollView
        ref={scrollRef}
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
        scrollToOverflowEnabled={false}
        scrollsToTop={false}
        scrollEnabled={searchPrefix == null && !isModalOpen}
        contentInset={{ top: ins.top }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={{
          height:
            screenDimensions.height -
            tabBarHeight -
            (Platform.OS === "android" ? 16 : 0),
        }}
        onScrollBeginDrag={onScrollBeginDrag}
        onScrollEndDrag={onScrollEndDrag}
      >
        <Spacer h={top} />
        <SearchHeader prefix={searchPrefix} setPrefix={setSearchPrefix} />
        {searchPrefix != null && (
          <SearchResults
            prefix={searchPrefix}
            style={{ marginHorizontal: 0 }}
          />
        )}
        {searchPrefix == null && (
          <>
            <AmountAndButtons account={account} />
            <SwipeUpDown
              ref={bottomSheetRef}
              itemMini={histListMini}
              itemFull={histListFull}
              swipeHeight={screenDimensions.height / 3}
              onShowFull={onOpenTransactionsModal}
              onShowMini={onCloseTransactionsModal}
            />
          </>
        )}
      </ScrollView>
    </View>
  );
}

function AmountAndButtons({ account }: { account: Account }) {
  const nav = useNav();
  const goSend = useCallback(
    () =>
      nav.navigate("SendTab", {
        screen: "SendNav",
        params: { autoFocus: true },
      }),
    [nav]
  );
  const goRequest = useCallback(
    () =>
      nav.navigate("ReceiveTab", {
        screen: "Receive",
        params: { autoFocus: true },
      }),
    [nav]
  );
  const goDeposit = useCallback(() => nav.navigate("DepositTab"), [nav]);

  const isEmpty = account.lastBalance === 0n;

  return (
    <TouchableWithoutFeedback>
      <View style={styles.amountAndButtons}>
        <Spacer h={64 + 12} />
        <TextLight>Your balance</TextLight>
        <TitleAmount amount={account.lastBalance} />
        <Spacer h={16} />
        <View style={styles.buttonRow}>
          <IconButton title="Deposit" onPress={goDeposit} />
          <IconButton title="Request" onPress={goRequest} />
          <IconButton title="Send" onPress={goSend} disabled={isEmpty} />
        </View>
      </View>
    </TouchableWithoutFeedback>
  );
}

function IconButton({
  title,
  onPress,
  disabled,
}: {
  title: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  const name: OctName = (function () {
    switch (title) {
      case "Deposit":
        return "plus";
      case "Request":
        return "download";
      case "Send":
        return "paper-airplane";
      default:
        return "question";
    }
  })();

  return (
    <View style={styles.iconButtonWrap}>
      <TouchableHighlight
        disabled={disabled}
        onPress={disabled ? undefined : onPress}
        style={disabled ? styles.iconButtonDisabled : styles.iconButton}
        hitSlop={16}
        {...touchHighlightUnderlay.primary}
      >
        <Octicons name={name} size={24} color={color.white} />
      </TouchableHighlight>
      <Spacer h={8} />
      <View style={disabled ? styles.iconLabelDisabled : styles.iconLabel}>
        <TextBody>{title}</TextBody>
      </View>
    </View>
  );
}

const screenDimensions = Dimensions.get("screen");

const iconButton = {
  backgroundColor: color.primary,
  height: 64,
  width: 64,
  borderRadius: 64,
  flexDirection: "row",
  justifyContent: "center",
  alignItems: "center",
} as const;

const iconLabel = {
  alignSelf: "stretch",
  flexDirection: "row",
  justifyContent: "center",
} as const;

const styles = StyleSheet.create({
  amountAndButtons: {
    flexDirection: "column",
    alignItems: "center",
  },
  buttonRow: {
    flexDirection: "row",
    paddingHorizontal: 20,
  },
  iconButtonWrap: {
    borderRadius: 16,
    paddingVertical: 16,
    width: 96,
    flexDirection: "column",
    alignItems: "center",
  },
  iconButton,
  iconButtonDisabled: {
    ...iconButton,
    opacity: 0.5,
  },
  iconLabel,
  iconLabelDisabled: {
    ...iconLabel,
    opacity: 0.5,
  },
});
