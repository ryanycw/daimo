import { EAccount, timeAgo } from "@daimo/common";
import { ScrollView, StyleSheet, TouchableHighlight, View } from "react-native";

import { navToAccountPage, useNav } from "../../common/nav";
import { Account } from "../../model/account";
import { ContactBubble } from "../shared/ContactBubble";
import { ScreenHeader } from "../shared/ScreenHeader";
import { color, ss, touchHighlightUnderlay } from "../shared/style";
import { TextBody } from "../shared/text";
import { useWithAccount } from "../shared/withAccount";

export function YourInvitesScreen() {
  const Inner = useWithAccount(YourInvitesScreenInner);
  return <Inner />;
}

function YourInvitesScreenInner({ account }: { account: Account }) {
  const nav = useNav();

  const invitees = account.invitees;

  return (
    <View style={ss.container.screen}>
      <ScreenHeader title="Your Invites" onBack={nav.goBack} />
      <ScrollView style={styles.list}>
        {invitees.map((invitee) => (
          <InviteeRow key={invitee.addr} invitee={invitee} />
        ))}
      </ScrollView>
    </View>
  );
}

function InviteeRow({ invitee }: { invitee: EAccount }) {
  const nav = useNav();

  return (
    <View style={{ marginHorizontal: 16 }}>
      <TouchableHighlight
        onPress={() => navToAccountPage(invitee, nav)}
        {...touchHighlightUnderlay.subtle}
        style={styles.rowUnderlayWrap}
      >
        <View style={styles.inviteeRow}>
          <View style={styles.inviteeRowLeft}>
            <ContactBubble contact={{ type: "eAcc", ...invitee }} size={36} />
            <TextBody color={color.midnight}>{invitee.name}</TextBody>
          </View>
          <View style={styles.inviteeRowRight}>
            {invitee.timestamp && (
              <TextBody color={color.gray3}>
                Joined {timeAgo(invitee.timestamp)} ago
              </TextBody>
            )}
          </View>
        </View>
      </TouchableHighlight>
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    backgroundColor: color.white,
    marginHorizontal: -16,
  },
  inviteeRow: {
    paddingVertical: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderColor: color.grayLight,
    marginHorizontal: 16,
  },
  inviteeRowLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  inviteeRowRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  rowUnderlayWrap: {
    marginHorizontal: -16,
  },
});
