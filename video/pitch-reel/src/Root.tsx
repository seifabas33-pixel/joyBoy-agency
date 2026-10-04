import { Composition, Folder } from "remotion";
import { PitchReel } from "./PitchReel";
import { Cta } from "./scenes/Cta";
import { Hook } from "./scenes/Hook";
import { Method } from "./scenes/Method";
import { Open } from "./scenes/Open";
import { Proof } from "./scenes/Proof";
import { Quote } from "./scenes/Quote";
import { Shows } from "./scenes/Shows";
import { Team } from "./scenes/Team";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition id="PitchReel" component={PitchReel} durationInFrames={1860} fps={30} width={1920} height={1080} />
      <Folder name="Scenes">
        <Composition id="Open" component={Open} durationInFrames={120} fps={30} width={1920} height={1080} />
        <Composition id="Hook" component={Hook} durationInFrames={240} fps={30} width={1920} height={1080} />
        <Composition id="Shows" component={Shows} durationInFrames={300} fps={30} width={1920} height={1080} />
        <Composition id="Team" component={Team} durationInFrames={180} fps={30} width={1920} height={1080} />
        <Composition id="Proof" component={Proof} durationInFrames={300} fps={30} width={1920} height={1080} />
        <Composition id="Quote" component={Quote} durationInFrames={300} fps={30} width={1920} height={1080} />
        <Composition id="Method" component={Method} durationInFrames={180} fps={30} width={1920} height={1080} />
        <Composition id="Cta" component={Cta} durationInFrames={240} fps={30} width={1920} height={1080} />
      </Folder>
    </>
  );
};
