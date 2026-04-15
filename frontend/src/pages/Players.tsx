import { useState, useCallback, useEffect } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import Dialog from '@mui/material/Dialog';
import TextField from '@mui/material/TextField';
import PersonIcon from '@mui/icons-material/Person';
import PeopleIcon from '@mui/icons-material/People';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import AddIcon from '@mui/icons-material/Add';
import { useThemedColors } from '../contexts/ThemeContext';
import { useStore } from '../store';
import { dataService } from '../services/DataService';
import { crossPlatformAlert } from '../utils/alert';
import { Player } from '../types';
import { typography, fontFamilies, spacing, borderRadius, shadows } from '../theme';

export const PlayersPage = () => {
  const colors = useThemedColors();
  const user = useStore((state) => state.user);
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newPlayerName, setNewPlayerName] = useState('');
  const [addingPlayer, setAddingPlayer] = useState(false);

  const loadPlayers = useCallback(async () => {
    if (!user) return;

    const playersData = await dataService.getAllPlayers((user as any).uid);
    setPlayers(playersData.filter((p) => !p.isGuest));
    setLoading(false);
  }, [user]);

  useEffect(() => {
    loadPlayers();
  }, [loadPlayers]);

  const handleAddPlayer = async () => {
    if (!newPlayerName.trim()) {
      crossPlatformAlert('Error', 'Please enter a player name');
      return;
    }

    if (!user) return;

    setAddingPlayer(true);
    try {
      await dataService.createPlayer({
        name: newPlayerName.trim(),
        userId: (user as any).uid,
        isGuest: false,
      });
      setNewPlayerName('');
      setShowAddModal(false);
      await loadPlayers();
    } catch (error) {
      crossPlatformAlert('Error', 'Failed to add player');
    } finally {
      setAddingPlayer(false);
    }
  };

  const handleDeletePlayer = (player: Player) => {
    crossPlatformAlert(
      'Delete player',
      `Are you sure you want to delete "${player.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await dataService.deletePlayer(player.id);
              await loadPlayers();
            } catch (error) {
              crossPlatformAlert('Error', 'Failed to delete player');
            }
          },
        },
      ],
    );
  };

  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          bgcolor: colors.background.primary,
        }}
      >
        <CircularProgress sx={{ color: colors.accent.gold }} size={40} />
        <Typography
          sx={{
            ...typography.bodyMedium,
            color: colors.text.secondary,
            mt: `${spacing.md}px`,
          }}
        >
          Loading players...
        </Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        bgcolor: colors.background.primary,
      }}
    >
      {/* Add player modal */}
      <Dialog
        open={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          setNewPlayerName('');
        }}
        PaperProps={{
          sx: {
            bgcolor: colors.background.elevated,
            borderRadius: `${borderRadius.xl}px`,
            border: `1px solid ${colors.border.light}`,
            maxWidth: 400,
            width: '100%',
            p: `${spacing.xl}px`,
          },
        }}
      >
        <Typography
          sx={{
            ...typography.label,
            color: colors.text.tertiary,
            textTransform: 'uppercase',
            mb: `${spacing.sm}px`,
          }}
        >
          New entry
        </Typography>
        <Typography
          sx={{
            ...typography.h2,
            fontFamily: fontFamilies.display,
            color: colors.text.primary,
            letterSpacing: -0.5,
            mb: `${spacing.md}px`,
          }}
        >
          Add a player
        </Typography>
        <Box
          sx={{
            height: 1.5,
            width: 48,
            bgcolor: colors.accent.gold,
            mb: `${spacing.lg}px`,
          }}
        />

        <Typography
          sx={{
            ...typography.label,
            color: colors.text.tertiary,
            textTransform: 'uppercase',
            mb: `${spacing.sm}px`,
          }}
        >
          Player name
        </Typography>
        <TextField
          fullWidth
          value={newPlayerName}
          onChange={(e) => setNewPlayerName(e.target.value)}
          placeholder="Enter name"
          autoFocus
          variant="standard"
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleAddPlayer();
          }}
          sx={{
            mb: `${spacing.xl}px`,
            '& .MuiInput-root': {
              fontFamily: fontFamilies.body,
              fontSize: typography.bodyLarge.fontSize,
              color: colors.text.primary,
              '&:before': {
                borderBottomColor: colors.border.light,
              },
              '&:hover:before': {
                borderBottomColor: `${colors.border.medium} !important`,
              },
              '&.Mui-focused:after': {
                borderBottomColor: colors.accent.gold,
              },
            },
            '& .MuiInput-input': {
              py: `${spacing.md}px`,
              '&::placeholder': {
                color: colors.text.tertiary,
                opacity: 1,
              },
            },
          }}
        />

        <Box sx={{ display: 'flex', gap: `${spacing.md}px` }}>
          <Box
            onClick={() => {
              setShowAddModal(false);
              setNewPlayerName('');
            }}
            sx={{
              flex: 1,
              py: `${spacing.md}px`,
              borderRadius: `${borderRadius.full}px`,
              border: `1px solid ${colors.border.light}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'background-color 200ms ease',
              '&:hover': {
                bgcolor: colors.surfaces.level2,
              },
            }}
          >
            <Typography
              sx={{
                fontFamily: fontFamilies.bodySemiBold,
                fontSize: typography.button.fontSize,
                color: colors.text.secondary,
                letterSpacing: 0.3,
              }}
            >
              Cancel
            </Typography>
          </Box>
          <Box
            onClick={addingPlayer ? undefined : handleAddPlayer}
            sx={{
              flex: 1,
              py: `${spacing.md}px`,
              borderRadius: `${borderRadius.full}px`,
              bgcolor: addingPlayer ? colors.text.disabled : colors.accent.gold,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: addingPlayer ? 'not-allowed' : 'pointer',
              opacity: addingPlayer ? 0.6 : 1,
              transition: 'background-color 200ms ease',
              '&:hover': {
                bgcolor: addingPlayer ? colors.text.disabled : colors.accent.goldDark,
              },
            }}
          >
            <Typography
              sx={{
                fontFamily: fontFamilies.bodySemiBold,
                fontSize: typography.button.fontSize,
                color: colors.text.inverse,
                letterSpacing: 0.3,
              }}
            >
              {addingPlayer ? 'Adding...' : 'Add player'}
            </Typography>
          </Box>
        </Box>
      </Dialog>

      <Box sx={{ flex: 1, overflow: 'auto' }}>
        {/* Header */}
        <Box
          sx={{
            px: `${spacing.xl}px`,
            pt: `${spacing.xxxl}px`,
            pb: `${spacing.lg}px`,
          }}
        >
          <Typography
            sx={{
              ...typography.label,
              color: colors.text.tertiary,
              textTransform: 'uppercase',
              mb: `${spacing.sm}px`,
            }}
          >
            Roster
          </Typography>
          <Typography
            sx={{
              ...typography.displayMedium,
              color: colors.text.primary,
              mb: `${spacing.md}px`,
            }}
          >
            Players
          </Typography>
          <Box
            sx={{
              height: 1.5,
              width: 48,
              bgcolor: colors.accent.gold,
              borderRadius: '1px',
              mb: `${spacing.md}px`,
            }}
          />
          <Typography
            sx={{
              ...typography.bodyLarge,
              color: colors.text.secondary,
            }}
          >
            Manage your golf players
          </Typography>
        </Box>

        {/* Content */}
        {players.length === 0 ? (
          <Box
            sx={{
              flex: 1,
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              px: `${spacing.xl}px`,
              py: `${spacing.xxl}px`,
            }}
          >
            <Box
              sx={{
                bgcolor: colors.background.card,
                borderRadius: `${borderRadius.xl}px`,
                border: `1px solid ${colors.border.light}`,
                p: `${spacing.xl}px`,
                width: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
                boxShadow: shadows.small,
              }}
            >
              <PeopleIcon
                sx={{
                  fontSize: 48,
                  color: colors.text.tertiary,
                  mb: `${spacing.md}px`,
                  opacity: 0.5,
                }}
              />
              <Typography
                sx={{
                  ...typography.h3,
                  fontFamily: fontFamilies.display,
                  color: colors.text.primary,
                  mb: `${spacing.sm}px`,
                }}
              >
                No players yet
              </Typography>
              <Typography
                sx={{
                  ...typography.bodyMedium,
                  color: colors.text.secondary,
                }}
              >
                Add your first player to get started
              </Typography>
            </Box>
          </Box>
        ) : (
          <Box sx={{ px: `${spacing.xl}px`, pb: `${spacing.xxl}px` }}>
            {players.map((player) => (
              <Box
                key={player.id}
                sx={{
                  bgcolor: colors.background.card,
                  borderRadius: `${borderRadius.xl}px`,
                  border: `1px solid ${colors.border.light}`,
                  p: `${spacing.lg}px`,
                  mb: `${spacing.md}px`,
                  boxShadow: shadows.small,
                }}
              >
                {/* Player header */}
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: `${spacing.md}px`,
                    mb: `${spacing.md}px`,
                  }}
                >
                  <Box
                    sx={{
                      width: 44,
                      height: 44,
                      borderRadius: '50%',
                      bgcolor: colors.surfaces.level2,
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      border: `1px solid ${colors.border.goldSubtle}`,
                      flexShrink: 0,
                    }}
                  >
                    <PersonIcon sx={{ fontSize: 22, color: colors.accent.gold }} />
                  </Box>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: `${spacing.sm}px`,
                        mb: `${spacing.xs}px`,
                      }}
                    >
                      <Typography
                        noWrap
                        sx={{
                          ...typography.h4,
                          fontFamily: fontFamilies.display,
                          color: colors.text.primary,
                          letterSpacing: -0.3,
                          flexShrink: 1,
                        }}
                      >
                        {player.name}
                      </Typography>
                      {player.isGuest && (
                        <Box
                          sx={{
                            px: `${spacing.sm}px`,
                            py: '2px',
                            borderRadius: `${borderRadius.full}px`,
                            border: `1px solid ${colors.border.light}`,
                          }}
                        >
                          <Typography
                            sx={{
                              fontFamily: fontFamilies.bodySemiBold,
                              fontSize: 10,
                              color: colors.text.tertiary,
                              letterSpacing: 0.3,
                            }}
                          >
                            Guest
                          </Typography>
                        </Box>
                      )}
                    </Box>
                    {player.userNumber && (
                      <Typography
                        sx={{
                          fontFamily: fontFamilies.mono,
                          fontSize: typography.bodySmall.fontSize,
                          color: colors.accent.gold,
                          letterSpacing: 0.3,
                        }}
                      >
                        #{player.userNumber}
                      </Typography>
                    )}
                  </Box>
                </Box>

                {/* Actions */}
                <Box
                  sx={{
                    display: 'flex',
                    gap: `${spacing.sm}px`,
                    borderTop: `1px solid ${colors.border.light}`,
                    pt: `${spacing.md}px`,
                  }}
                >
                  <Box
                    onClick={() => handleDeletePlayer(player)}
                    sx={{
                      flex: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: `${spacing.xs}px`,
                      py: `${spacing.sm}px`,
                      borderRadius: `${borderRadius.full}px`,
                      border: `1px solid ${colors.border.light}`,
                      cursor: 'pointer',
                      transition: 'background-color 200ms ease',
                      '&:hover': {
                        bgcolor: `${colors.scoring.negative}11`,
                      },
                    }}
                  >
                    <DeleteOutlineIcon sx={{ fontSize: 14, color: colors.scoring.negative }} />
                    <Typography
                      sx={{
                        fontFamily: fontFamilies.bodySemiBold,
                        fontSize: typography.bodySmall.fontSize,
                        color: colors.scoring.negative,
                        letterSpacing: 0.3,
                      }}
                    >
                      Delete
                    </Typography>
                  </Box>
                </Box>
              </Box>
            ))}
          </Box>
        )}
      </Box>

      {/* Footer with add button */}
      <Box
        sx={{
          p: `${spacing.lg}px`,
          pb: `${spacing.xl}px`,
          bgcolor: colors.background.primary,
          borderTop: `1px solid ${colors.border.light}`,
          flexShrink: 0,
        }}
      >
        <Box
          onClick={() => setShowAddModal(true)}
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: `${spacing.sm}px`,
            py: `${spacing.md}px`,
            bgcolor: colors.accent.gold,
            borderRadius: `${borderRadius.full}px`,
            cursor: 'pointer',
            transition: 'background-color 200ms ease',
            '&:hover': {
              bgcolor: colors.accent.goldDark,
            },
            '&:active': {
              transform: 'scale(0.98)',
            },
          }}
        >
          <AddIcon sx={{ fontSize: 20, color: colors.text.inverse }} />
          <Typography
            sx={{
              fontFamily: fontFamilies.bodySemiBold,
              fontSize: typography.button.fontSize,
              color: colors.text.inverse,
              letterSpacing: 0.2,
            }}
          >
            Add new player
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};

export default PlayersPage;
