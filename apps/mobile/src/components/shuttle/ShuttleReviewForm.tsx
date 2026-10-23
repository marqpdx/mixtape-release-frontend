import { StyleSheet, Platform, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';
import type { ShuttlePacketOut } from '@mixtape/api/clients/shuttle/contract';
import type { ShuttleReview } from '../../services/shuttle/review';

function CheckRow({ label, checked, onPress }: {
  label: string; checked: boolean; onPress: () => void;
}) {
  return (
    <TouchableOpacity
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      accessibilityLabel={label}
      style={styles.checkRow}
      onPress={onPress}
    >
      <Text style={[styles.check, checked && styles.checked]}>{checked ? '✓' : ''}</Text>
      <Text style={styles.rowLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

export function ShuttleReviewForm({ packet, review, onChange, disabled }: {
  packet: ShuttlePacketOut; review: ShuttleReview;
  onChange: (next: ShuttleReview) => void; disabled: boolean;
}) {
  const update = (patch: Partial<ShuttleReview>) => onChange({ ...review, ...patch });
  const toggle = (id: string) => update({ tickedIds: review.tickedIds.includes(id)
    ? review.tickedIds.filter((value) => value !== id) : [...review.tickedIds, id] });
  const itemName = (id: string) => packet.items.find((item) => item.item_id === id)?.name ?? id;
  return <View pointerEvents={disabled ? 'none' : 'auto'} style={{ gap: 14, opacity: disabled ? 0.6 : 1 }}>
    <Text style={styles.body}>Review one coherent weave. Checked entries will publish together only when you choose Publish. Leaving something out is an explicit change of scope, not a later Shuttle chore.</Text>
            <Text style={styles.anchor}>{packet.anchor.headline}</Text>
            <View style={styles.card}>
              <Text style={styles.heading}>Things & places</Text>
              {packet.items.map((item) => (
                <View key={item.item_id} style={styles.entry}>
                  <CheckRow
                    label={`${item.name} · ${item.locale}`}
                    checked={review.tickedIds.includes(item.item_id)}
                    onPress={() => toggle(item.item_id)}
                  />
                  <Text style={styles.hint}>{item.kind === 'place' ? 'Place' : 'Thing'} · {item.match_state === 'near_duplicate' ? 'Possible match' : item.match_state}</Text>
                  {item.match_state === 'near_duplicate' && item.candidate && review.tickedIds.includes(item.item_id) && (
                    <View style={styles.merge}>
                      <Text style={styles.body}>Same as {item.candidate.name}?</Text>
                      <View style={styles.choices}>
                        {(['merge', 'keep_separate'] as const).map((decision) => (
                          <TouchableOpacity
                            key={decision}
                            accessibilityRole="radio"
                            accessibilityState={{ checked: review.mergeDecisions[item.item_id] === decision }}
                            onPress={() => update({ mergeDecisions: { ...review.mergeDecisions, [item.item_id]: decision } })}
                            style={[styles.choice, review.mergeDecisions[item.item_id] === decision && styles.chosen]}
                          >
                            <Text style={styles.link}>{decision === 'merge' ? 'Merge' : 'Keep separate'}</Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>
                  )}
                </View>
              ))}
            </View>
            <View style={styles.card}>
              <Text style={styles.heading}>Ideas</Text>
              {packet.ideas.map((idea) => (
                <View key={idea.idea_id} style={styles.entry}>
                  <CheckRow label={idea.wording} checked={review.tickedIds.includes(idea.idea_id)} onPress={() => toggle(idea.idea_id)} />
                  <TextInput
                    accessibilityLabel={`Wording for ${idea.wording}`}
                    style={styles.input}
                    value={review.ideaWordings[idea.idea_id]}
                    onChangeText={(wording) => update({ ideaWordings: { ...review.ideaWordings, [idea.idea_id]: wording } })}
                  />
                  <Text style={styles.hint}>Closest existing: {idea.closest_existing.map((candidate) => candidate.name).join(', ') || 'none found'}</Text>
                </View>
              ))}
            </View>
            <View style={styles.card}>
              <Text style={styles.heading}>Adjacencies · one cluster</Text>
              {packet.adjacencies.map((adjacency) => (
                <View key={adjacency.adjacency_id} style={styles.entry}>
                  <CheckRow
                    label={adjacency.ends.map(itemName).join(' ↔ ')}
                    checked={review.tickedIds.includes(adjacency.adjacency_id)}
                    onPress={() => toggle(adjacency.adjacency_id)}
                  />
                  <Text style={styles.hint}>{adjacency.reason}</Text>
                </View>
              ))}
            </View>
            <View style={styles.card}>
              <Text style={styles.heading}>Stories</Text>
              <Text style={styles.body}>Finish the stories for the Places in this weave. Known stories are kept verbatim; edit only in your own words.</Text>
              {packet.story_prompts.map(({ item_id, prompt }) => (
                <View key={item_id} style={styles.entry}>
                  <Text style={styles.label}>{itemName(item_id)}</Text>
                  {review.tickedIds.includes(item_id) ? (
                    <>
                      <Text style={styles.hint}>{prompt}</Text>
                      <TextInput
                        accessibilityLabel={`Story for ${itemName(item_id)}`}
                        style={[styles.input, styles.story]}
                        multiline
                        placeholder="Here's the story…"
                        placeholderTextColor="#6B8499"
                        value={review.stories[item_id] ?? ''}
                        onChangeText={(text) => update({ stories: { ...review.stories, [item_id]: text } })}
                      />
                      <TextInput
                        accessibilityLabel={`Music link for ${itemName(item_id)}`}
                        style={styles.input}
                        placeholder="Music link (optional)"
                        placeholderTextColor="#6B8499"
                        autoCapitalize="none"
                        autoCorrect={false}
                        keyboardType="url"
                        value={review.musicLinks[item_id] ?? ''}
                        onChangeText={(link) => update({ musicLinks: { ...review.musicLinks, [item_id]: link } })}
                      />
                    </>
                  ) : <Text style={styles.hint}>Explicitly left out of this weave. The source stays in Notebook.</Text>}
                </View>
              ))}
            </View>
            {packet.stories_not_yet_told && (
              <View style={styles.card}>
                <Text style={styles.heading}>Stories Not Yet Told</Text>
                <Text style={styles.body}>{packet.stories_not_yet_told.question}</Text>
                {packet.stories_not_yet_told.offers.map((offer) => <Text key={offer.id} style={styles.hint}>{offer.label}</Text>)}
                <View style={styles.switchRow}>
                  <Text style={styles.label}>Keep them?</Text>
                  <Switch accessibilityLabel="Keep Stories Not Yet Told" value={review.keepOffers} onValueChange={(keepOffers) => update({ keepOffers })} />
                </View>
              </View>
            )}
  </View>;
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#EEF4F8' },
  header: { paddingHorizontal: 18, paddingTop: 18 },
  content: { paddingHorizontal: 18, paddingBottom: 32, gap: 14 },
  title: { fontSize: 28, fontWeight: '700', color: '#173753' },
  notice: { color: '#3C5C73', fontSize: 13, lineHeight: 19 },
  anchor: { color: '#173753', fontSize: 18, fontWeight: '700', lineHeight: 26 },
  card: { backgroundColor: '#FFF', borderRadius: 18, padding: 16, gap: 10, borderWidth: 1, borderColor: '#D7E0EA' },
  heading: { color: '#173753', fontSize: 18, fontWeight: '700' },
  body: { color: '#294A63', fontSize: 15, lineHeight: 22 },
  hint: { color: '#516C82', fontSize: 13, lineHeight: 19 },
  entry: { gap: 8, paddingVertical: 8 },
  checkRow: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 44 },
  check: { width: 26, height: 26, borderRadius: 6, borderWidth: 1, borderColor: '#6B8499', color: '#FFF', textAlign: 'center', lineHeight: 24, fontWeight: '700' },
  checked: { backgroundColor: '#0E5AA7', borderColor: '#0E5AA7' },
  rowLabel: { flex: 1, color: '#173753', fontSize: 15, lineHeight: 21, fontWeight: '600' },
  label: { color: '#173753', fontSize: 15, fontWeight: '600' },
  merge: { padding: 12, backgroundColor: '#EEF4F8', borderRadius: 10, gap: 8 },
  choices: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  choice: { padding: 12, minHeight: 44, borderRadius: 10, borderWidth: 1, borderColor: '#B9C9D6' },
  chosen: { backgroundColor: '#D6E8F8', borderColor: '#0E5AA7' },
  input: { borderWidth: 1, borderColor: '#B9C9D6', borderRadius: 10, padding: 12, color: '#173753', fontSize: 15, minHeight: 44 },
  story: { minHeight: 82, textAlignVertical: 'top' },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  secondary: { minHeight: 44, justifyContent: 'center', paddingVertical: 10 },
  link: { color: '#0E5AA7', fontSize: 14, fontWeight: '600' },
  publish: { backgroundColor: '#0E5AA7', borderRadius: 14, padding: 16, alignItems: 'center' },
  publishText: { color: '#FFF', fontSize: 17, fontWeight: '700' },
  error: { color: '#A32929', fontSize: 14, lineHeight: 20 },
  code: { fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace', color: '#294A63', fontSize: 12, lineHeight: 18 },
});
