import {
  DaimoInviteCodeStatus,
  EAccount,
  formatDaimoLink,
} from "@daimo/common";
import Octicons from "@expo/vector-icons/Octicons";
import * as Clipboard from "expo-clipboard";
import { Image } from "expo-image";
import { useCallback, useState } from "react";
import {
  ImageBackground,
  Linking,
  Pressable,
  StyleSheet,
  TouchableHighlight,
  View,
} from "react-native";

import InviteBackground from "../../../assets/invite-background.png";
import { navToAccountPage, useNav } from "../../common/nav";
import { shareURL } from "../../logic/externalAction";
import { Account } from "../../model/account";
import { ContactBubble } from "../shared/Bubble";
import { ButtonBig, ButtonMed, TextButton } from "../shared/Button";
import { ButtonCircle } from "../shared/ButtonCircle";
import { CoverGraphic } from "../shared/CoverGraphic";
import { PressableText } from "../shared/PressableText";
import { ScreenHeader } from "../shared/ScreenHeader";
import Spacer from "../shared/Spacer";
import image from "../shared/image";
import { color, ss, touchHighlightUnderlay } from "../shared/style";
import {
  DaimoText,
  TextBody,
  TextBtnCaps,
  TextCenter,
  TextH2,
  TextLight,
} from "../shared/text";
import { useWithAccount } from "../shared/withAccount";

export function InviteScreen() {
  const Inner = useWithAccount(InviteScreenInner);
  return <Inner />;
}

function InviteScreenInner({ account }: { account: Account }) {
  const inviteLinkStatus = account.inviteLinkStatus;

  console.log(
    `[INVITE] render ${account.name}, ${JSON.stringify(inviteLinkStatus)}`,
  );

  const header =
    account.invitees.length > 0 ? (
      <Header
        invitees={account.invitees}
        inviteLinkStatus={inviteLinkStatus || undefined}
      />
    ) : (
      <LockedHeader />
    );

  const footer = inviteLinkStatus?.isValid ? (
    <ReferralButtonsFooter
      inviteCodeStatus={inviteLinkStatus}
      account={account}
    />
  ) : (
    <LockedFooter />
  );

  return (
    <View style={ss.container.padH16}>
      {header}
      {footer}
    </View>
  );
}

function InviteeBubble({ invitee }: { invitee: EAccount }) {
  const nav = useNav();

  const onPress = useCallback(() => {
    navToAccountPage(invitee, nav);
  }, [invitee, nav]);

  return (
    <View style={styles.inviteeBubbleContainer}>
      <ButtonCircle size={64} onPress={onPress}>
        <ContactBubble
          contact={{ type: "eAcc", ...invitee }}
          size={64}
          transparent
        />
      </ButtonCircle>
    </View>
  );
}

function InviteesBubbles({ invitees }: { invitees: EAccount[] }) {
  const nav = useNav();

  const displayInvitees = invitees.slice(-3); // Most recent invitees
  const moreInvitees =
    invitees.length > 3 ? invitees.length - displayInvitees.length : 0;

  return (
    <View style={styles.inviteeContainer}>
      {displayInvitees.map((invitee) => (
        <InviteeBubble key={invitee.addr} invitee={invitee} />
      ))}
      {moreInvitees > 0 && (
        <>
          <Spacer w={8} />
          <PressableText
            text={`+${moreInvitees} more`}
            onPress={() => nav.push("YourInvites")}
            hitSlop={16}
          />
        </>
      )}
    </View>
  );
}

function HeaderGraphic({ invitees }: { invitees?: EAccount[] }) {
  return invitees && invitees.length > 0 ? (
    <View style={styles.imageContainer}>
      <ImageBackground source={InviteBackground} style={styles.image}>
        <InviteesBubbles invitees={invitees} />
      </ImageBackground>
    </View>
  ) : (
    <CoverGraphic type="invite" />
  );
}

function HeaderCountText({
  invitees,
  usesLeft,
}: {
  invitees?: EAccount[];
  usesLeft?: number;
}) {
  const nav = useNav();

  const showInviteesCount = invitees != null && invitees.length > 0;
  const showUsesLeft = usesLeft != null && (showInviteesCount || usesLeft > 0);

  return (
    <View>
      {showInviteesCount && (
        <Pressable
          onPress={() => nav.push("YourInvites")}
          hitSlop={16}
          children={({ pressed }) => (
            <TextCenter>
              <TextBody color={pressed ? color.primaryBgLight : color.primary}>
                You've invited {invitees?.length}{" "}
                {invitees?.length === 1 ? "friend" : "friends"}
              </TextBody>
            </TextCenter>
          )}
        />
      )}
      {showInviteesCount && showUsesLeft && <Spacer h={8} />}
      {showUsesLeft && (
        <TextCenter>
          <TextBody color={showInviteesCount ? color.grayMid : color.primary}>
            {usesLeft} {usesLeft === 1 ? "invite" : "invites"} left
          </TextBody>
        </TextCenter>
      )}
    </View>
  );
}

const headerTitle = "Invite your friends and earn USDC!";

function LockedHeader() {
  return (
    <View>
      <ScreenHeader title="Invite Friends" />
      <HeaderGraphic />
      <Spacer h={32} />
      <TextCenter>
        <TextH2>{headerTitle}</TextH2>
      </TextCenter>
    </View>
  );
}

function LockedFooter() {
  const nav = useNav();
  const goToSend = () =>
    nav.navigate("SendTab", {
      screen: "SendNav",
      params: { autoFocus: true },
    });

  return (
    <View>
      <Spacer h={32} />
      <TextCenter>
        <Octicons name="lock" size={36} color={color.gray3} />
      </TextCenter>
      <Spacer h={32} />
      <TextCenter>
        <TextBody color={color.gray3}>
          Use Daimo more to unlock invites. Send a payment link to onboard your
          contacts.
        </TextBody>
      </TextCenter>
      <Spacer h={32} />
      <ButtonMed type="primary" title="SEND" onPress={goToSend} />
    </View>
  );
}

function Header({
  invitees,
  inviteLinkStatus,
}: {
  invitees: EAccount[];
  inviteLinkStatus?: DaimoInviteCodeStatus;
}) {
  return (
    <View>
      <ScreenHeader title="Invite Friends" />
      <HeaderGraphic invitees={invitees} />
      <Spacer h={8} />
      <HeaderCountText
        invitees={invitees}
        usesLeft={inviteLinkStatus?.usesLeft}
      />
      <Spacer h={32} />
      <TextCenter>
        <TextH2>{headerTitle}</TextH2>
      </TextCenter>
    </View>
  );
}

function ReferralButtonsFooter({
  inviteCodeStatus,
  account,
}: {
  inviteCodeStatus: DaimoInviteCodeStatus;
  account: Account;
}) {
  const { link, bonusDollarsInvitee, bonusDollarsInviter } = inviteCodeStatus;
  const url = formatDaimoLink(link);

  const bonusSubtitle = (() => {
    if (
      bonusDollarsInvitee &&
      bonusDollarsInviter &&
      bonusDollarsInvitee === bonusDollarsInviter
    ) {
      return ` and we'll send you both $${bonusDollarsInvitee} USDC`;
    } else if (bonusDollarsInvitee) {
      return ` and we'll send them $${bonusDollarsInvitee} USDC`;
    } else if (bonusDollarsInviter) {
      return ` and we'll send you $${bonusDollarsInviter} USDC`;
    } else return "";
  })();

  const shareFarcaster = () => {
    console.log(`[INVITE] share on farcaster`);
    const msg = "Join+me+on+Daimo";
    const frameUrl = `https://daimo.com/frame/invite/${account.address}`;
    const url = `https://warpcast.com/~/compose?text=${msg}&embeds[]=${frameUrl}`;
    Linking.openURL(url);
  };

  return (
    <View>
      <Spacer h={32} />
      <TextCenter>
        <TextLight>
          You'll get credit for the invite on their profile{bonusSubtitle}
        </TextLight>
      </TextCenter>
      <Spacer h={32} />
      <View style={styles.referralButtons}>
        <View style={styles.referralHalfScreen}>
          <TextCenter>
            <TextLight>Invite Code</TextLight>
          </TextCenter>
          <Spacer h={8} />
          <InviteCodeCopier code={link.code} url={url} />
        </View>
        <View style={styles.referralHalfScreen}>
          <TextCenter>
            <TextLight>Invite Link</TextLight>
          </TextCenter>
          <Spacer h={8} />
          <ButtonBig
            type="primary"
            title="Share Link"
            onPress={() => shareURL(link)}
          />
        </View>
      </View>
      <Spacer h={16} />
      <View>
        <TextButton onPress={shareFarcaster}>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Image
              source={{ uri: image.iconFarcaster }}
              style={{ width: 16, height: 16, zIndex: -1 }}
            />
            <Spacer w={8} />
            <TextBtnCaps color={color.grayDark}>
              SHARE FRAME ON FARCASTER
            </TextBtnCaps>
          </View>
        </TextButton>
      </View>
    </View>
  );
}

function InviteCodeCopier({ code, url }: { code: string; url: string }) {
  const [justCopied, setJustCopied] = useState(false);

  const copy = useCallback(async () => {
    await Clipboard.setStringAsync(url);
    setJustCopied(true);
    setTimeout(() => setJustCopied(false), 1000);
  }, [url]);

  return (
    <TouchableHighlight
      style={styles.codeCopier}
      onPress={copy}
      {...touchHighlightUnderlay.subtle}
    >
      <View style={styles.codeView}>
        <DaimoText style={styles.codeFont} numberOfLines={1}>
          {code}
        </DaimoText>
        <Spacer w={4} />
        <Octicons
          name={justCopied ? "check" : "copy"}
          size={16}
          color={color.midnight}
        />
      </View>
    </TouchableHighlight>
  );
}

const styles = StyleSheet.create({
  imageContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  image: {
    resizeMode: "contain",
    flex: 1,
    aspectRatio: 2.2,
    justifyContent: "center",
    alignItems: "center",
  },
  referralButtons: {
    flexDirection: "row",
  },
  referralHalfScreen: {
    width: "50%",
    paddingHorizontal: 8,
  },
  codeCopier: {
    paddingHorizontal: 24,
    paddingVertical: 18,
    borderRadius: 8,
    backgroundColor: color.white,
    borderColor: color.grayLight,
    borderWidth: 1,
    ...ss.container.shadow,
  },
  codeView: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  codeFont: {
    fontSize: 16,
    fontWeight: "bold",
    letterSpacing: 1,
    textAlign: "center",
    color: color.midnight,
  },
  rowHeader: {
    flexDirection: "row",
    paddingVertical: 8,
    paddingTop: 16,
    paddingHorizontal: 2,
    backgroundColor: color.white,
  },
  inviteeContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingLeft: 8,
  },
  inviteeBubbleContainer: {
    width: 63, // 63 = size - 1, as used by ContactBubble
    height: 63,
    borderRadius: 99,
    marginLeft: -8,
    backgroundColor: color.white,
    shadowOffset: { height: 2, width: -1 },
    elevation: 2,
    shadowOpacity: 0.1,
  },
});
