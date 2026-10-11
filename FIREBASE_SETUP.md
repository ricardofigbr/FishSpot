# Firebase de teste

O app usa Firebase Authentication para as contas e Cloud Firestore para os pontos de pesca de cada conta. Nenhum cadastro, senha, sessão ou ponto é salvo no AsyncStorage.

## Preparar o projeto Firebase

1. Crie um projeto no Firebase Console e registre um app Web para obter a configuração do SDK JavaScript.
2. Em **Authentication > Sign-in method**, habilite **E-mail/senha**. O app transforma o nome de usuário em um identificador interno no domínio reservado `fishspot.test`; não pede e-mail real nem envia mensagens.
3. Crie um banco em **Firestore Database**.
4. Publique no Firestore as regras do arquivo `firestore.rules`.
5. Copie `.env.example` para `.env.local` e preencha os valores da configuração do app Web. Reinicie o Expo depois de alterar as variáveis.

As variáveis `EXPO_PUBLIC_*` são incluídas no aplicativo cliente. Não coloque chaves de conta de serviço ou outros segredos nelas.

Os pontos ficam em `users/{uid}/spots/{spotId}` e as regras limitam cada conta aos próprios documentos.

## Comportamento offline

Auth e Firestore usam somente memória local. Enquanto a sessão estiver aberta, o Firestore pode exibir dados em cache e manter gravações pendentes até a conexão voltar. Se o app for encerrado antes da sincronização, essas gravações pendentes são perdidas. Depois de reiniciar, será necessário internet para entrar novamente. O Firebase JS SDK não oferece persistência offline do Firestore no React Native.

As imagens selecionadas continuam sendo URIs locais do dispositivo; para sincronizá-las entre dispositivos será necessário configurar um serviço de upload de arquivos compatível.
